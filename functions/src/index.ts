import * as admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { createHmac, timingSafeEqual } from 'crypto';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { defineSecret } from 'firebase-functions/params';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const bucket = getStorage().bucket();

const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const MP_WEBHOOK_SECRET = defineSecret('MP_WEBHOOK_SECRET');

const COLECCION = 'ecosistema_usuarios';
const URL_EXPIRACION_SEGUNDOS = 15 * 60;

const NIVELES_VALIDOS = new Set([
  'preview_cap1',
  'articulacion',
  'estacion_cs1',
  'estacion_cs2',
  'estacion_cs3',
  'estacion_pfh1',
  'estacion_pfh2',
  'estacion_pfh3',
]);

const ACCESOS_INICIALES = {
  preview_cap1: true,
  articulacion: true,
  estacion_cs1: false,
  estacion_cs2: false,
  estacion_cs3: false,
  estacion_pfh1: false,
  estacion_pfh2: false,
  estacion_pfh3: false,
};

type RolEcosistema =
  | 'lector_free'
  | 'lector_cs1'
  | 'lector_cs2'
  | 'lector_cs3'
  | 'lector_full';

type AccesosEcosistema = typeof ACCESOS_INICIALES;

interface RegistroInput {
  nombre: string;
  plantel?: string;
}

interface DescargaInput {
  nivel: string;
  archivo: string;
}

interface DescargaOutput {
  url: string;
  expira: string;
}

interface WebhookBody {
  event: string;
  email: string;
  producto: string;
}

const PRODUCTO_ACCESOS: Record<string, (keyof AccesosEcosistema)[]> = {
  cs1: ['estacion_cs1'],
  cs2: ['estacion_cs2'],
  cs3: ['estacion_cs3'],
  full: ['estacion_cs1', 'estacion_cs2', 'estacion_cs3'],
  pfh1: ['estacion_pfh1'],
  pfh2: ['estacion_pfh2'],
  pfh3: ['estacion_pfh3'],
};

const EVENTOS_PAGO_EXITOSO = new Set([
  'payment.approved',
  'checkout.session.completed',
]);

export const registrarLectorEcosistema = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'Debes iniciar sesión para registrarte en el ecosistema.'
    );
  }

  const uid = request.auth.uid;
  const email = request.auth.token.email ?? null;
  const { nombre, plantel } = request.data as RegistroInput;

  if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
    throw new HttpsError(
      'invalid-argument',
      'El campo "nombre" es obligatorio y no puede estar vacío.'
    );
  }

  if (plantel !== undefined && typeof plantel !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'El campo "plantel" debe ser una cadena de texto si se proporciona.'
    );
  }

  let existingDoc;
  try {
    existingDoc = await db.collection(COLECCION).doc(uid).get();
  } catch (error) {
    logger.error('Error al leer documento de ecosistema_usuarios', {
      uid,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new HttpsError(
      'internal',
      'Error al verificar el registro. Intenta de nuevo.'
    );
  }

  if (existingDoc.exists) {
    const existingData = existingDoc.data() as { rol?: RolEcosistema };
    return {
      success: true,
      rol: existingData.rol ?? 'lector_free',
    };
  }

  try {
    await db.collection(COLECCION).doc(uid).set({
      uid,
      email,
      nombre: nombre.trim(),
      plantel: plantel ? plantel.trim() : null,
      rol: 'lector_free' as RolEcosistema,
      accesos: ACCESOS_INICIALES,
      registrado: admin.firestore.FieldValue.serverTimestamp(),
      expira: null,
    });
  } catch (error) {
    logger.error('Error al crear documento en ecosistema_usuarios', {
      uid,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new HttpsError(
      'internal',
      'Error al registrar tu cuenta en el ecosistema. Intenta de nuevo.'
    );
  }

  logger.info('Lector registrado en ecosistema', { uid, email, rol: 'lector_free' });

  return {
    success: true,
    rol: 'lector_free' as RolEcosistema,
  };
});

function normalizeArchivo(archivo: string): string[] {
  const trimmed = archivo.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.toLowerCase().endsWith('.html')) {
    return [trimmed, trimmed.replace(/\.html$/i, '')];
  }

  return [trimmed, `${trimmed}.html`];
}

function foldersForNivel(nivel: string): string[] {
  switch (nivel) {
    case 'preview_cap1':
      return ['ecosistema/preview'];
    case 'articulacion':
      return [
        'ecosistema/materiales/articulacion',
        'ecosistema/materiales/Articulacion',
      ];
    case 'estacion_cs1':
      return [
        'ecosistema/materiales/estacion_CS1',
        'ecosistema/materiales/estacion_cs1',
      ];
    case 'estacion_cs2':
      return [
        'ecosistema/materiales/estacion_CS2',
        'ecosistema/materiales/estacion_cs2',
      ];
    case 'estacion_cs3':
      return [
        'ecosistema/materiales/estacion_CS3',
        'ecosistema/materiales/estacion_cs3',
      ];
    case 'estacion_pfh1':
      return [
        'ecosistema/materiales/estacion_PFH1',
        'ecosistema/materiales/estacion_pfh1',
      ];
    case 'estacion_pfh2':
      return [
        'ecosistema/materiales/estacion_PFH2',
        'ecosistema/materiales/estacion_pfh2',
      ];
    case 'estacion_pfh3':
      return [
        'ecosistema/materiales/estacion_PFH3',
        'ecosistema/materiales/estacion_pfh3',
      ];
    default:
      return [];
  }
}

async function findExistingFilePath(nivel: string, archivo: string): Promise<string | null> {
  const folders = foldersForNivel(nivel);
  const files = normalizeArchivo(archivo);
  for (const folder of folders) {
    for (const fileName of files) {
      const candidatePath = `${folder}/${fileName}`;
      const [exists] = await bucket.file(candidatePath).exists();
      if (exists) {
        return candidatePath;
      }
    }
  }
  return null;
}

export const solicitarDescarga = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const authHeader = req.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticacion requerido' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    await admin.auth().verifyIdToken(token);
  } catch {
    res.status(401).json({ error: 'Token invalido o expirado' });
    return;
  }

  let body: { data?: DescargaInput } & Partial<DescargaInput>;
  try {
    body = req.body as { data?: DescargaInput } & Partial<DescargaInput>;
  } catch {
    res.status(400).json({ error: 'Body JSON invalido' });
    return;
  }

  const nivel = body.data?.nivel ?? body.nivel;
  const archivo = body.data?.archivo ?? body.archivo;

  if (!nivel || typeof nivel !== 'string' || nivel.trim().length === 0) {
    res.status(400).json({ error: 'Falta el campo "nivel"' });
    return;
  }

  if (!archivo || typeof archivo !== 'string' || archivo.trim().length === 0) {
    res.status(400).json({ error: 'Falta el campo "archivo"' });
    return;
  }

  if (!NIVELES_VALIDOS.has(nivel)) {
    res.status(400).json({ error: `Nivel no válido: ${nivel}` });
    return;
  }

  try {
    const filePath = await findExistingFilePath(nivel, archivo);
    if (!filePath) {
      res.status(404).json({
        error: `El archivo "${archivo}" no existe en el nivel "${nivel}".`,
      });
      return;
    }

    const expiresAt = Date.now() + URL_EXPIRACION_SEGUNDOS * 1000;
    const [url] = await bucket.file(filePath).getSignedUrl({
      action: 'read',
      expires: expiresAt,
    });

    logger.info('Signed URL generada', { nivel, archivo: archivo.trim(), filePath });

    const output: DescargaOutput = {
      url,
      expira: new Date(expiresAt).toISOString(),
    };

    res.status(200).json(output);
  } catch (error) {
    logger.error('Error generando signed URL', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

function verificarFirmaHmac(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(payload).digest('hex');

  try {
    const bufExpected = Buffer.from(expected, 'hex');
    const bufSignature = Buffer.from(signature, 'hex');
    if (bufExpected.length !== bufSignature.length) {
      return false;
    }
    return timingSafeEqual(bufExpected, bufSignature);
  } catch {
    return false;
  }
}

function calcularRol(accesos: AccesosEcosistema): RolEcosistema {
  if (accesos.estacion_cs1 && accesos.estacion_cs2 && accesos.estacion_cs3) {
    return 'lector_full';
  }
  if (accesos.estacion_cs3) {
    return 'lector_cs3';
  }
  if (accesos.estacion_cs2) {
    return 'lector_cs2';
  }
  if (accesos.estacion_cs1) {
    return 'lector_cs1';
  }
  return 'lector_free';
}

export const webhookPago = onRequest(
  { secrets: [STRIPE_WEBHOOK_SECRET, MP_WEBHOOK_SECRET] },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const rawBody = typeof req.rawBody === 'string' ? req.rawBody : req.rawBody.toString('utf8');
    const stripeSignature = req.get('stripe-signature');
    const mpSignature = req.get('x-signature');

    let firmaValida = false;

    if (stripeSignature) {
      const secret = STRIPE_WEBHOOK_SECRET.value();
      if (!secret) {
        logger.error('STRIPE_WEBHOOK_SECRET no configurada');
        res.status(500).send('Configuración incompleta');
        return;
      }
      firmaValida = verificarFirmaHmac(rawBody, stripeSignature, secret);
    } else if (mpSignature) {
      const secret = MP_WEBHOOK_SECRET.value();
      if (!secret) {
        logger.error('MP_WEBHOOK_SECRET no configurada');
        res.status(500).send('Configuración incompleta');
        return;
      }
      firmaValida = verificarFirmaHmac(rawBody, mpSignature, secret);
    } else {
      logger.warn('Webhook recibido sin header de firma');
      res.status(403).send('Firma ausente');
      return;
    }

    if (!firmaValida) {
      logger.warn('Firma de webhook inválida');
      res.status(403).send('Firma inválida');
      return;
    }

    const body = req.body as WebhookBody;
    const { event, email, producto } = body;

    if (!event || !email || !producto) {
      logger.warn('Webhook con body incompleto', { event, email, producto });
      res.status(200).send('Body incompleto, ignorado');
      return;
    }

    if (!EVENTOS_PAGO_EXITOSO.has(event)) {
      logger.info('Evento de webhook ignorado', { event });
      res.status(200).send('Evento ignorado');
      return;
    }

    const accesosAActivar = PRODUCTO_ACCESOS[producto];
    if (!accesosAActivar) {
      logger.warn('Producto no reconocido en webhook', { producto });
      res.status(200).send('Producto no reconocido, ignorado');
      return;
    }

    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      const uid = userRecord.uid;
      const docRef = db.collection(COLECCION).doc(uid);
      const userDoc = await docRef.get();

      if (!userDoc.exists) {
        logger.warn('Usuario sin documento en ecosistema_usuarios', { email, uid });
        res.status(200).send('Usuario no registrado en ecosistema');
        return;
      }

      const userData = userDoc.data() as { accesos: AccesosEcosistema; rol: RolEcosistema };
      const nuevosAccesos: AccesosEcosistema = { ...userData.accesos };
      for (const clave of accesosAActivar) {
        nuevosAccesos[clave] = true;
      }

      const nuevoRol = calcularRol(nuevosAccesos);

      await docRef.update({
        accesos: nuevosAccesos,
        rol: nuevoRol,
      });

      logger.info('Accesos actualizados tras pago', {
        email,
        producto,
        rolAnterior: userData.rol,
        rolNuevo: nuevoRol,
      });

      res.status(200).send('OK');
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      if (mensaje.includes('auth/user-not-found')) {
        logger.warn('Usuario no encontrado en Auth para webhook de pago', { email });
        res.status(200).send('Usuario no encontrado en Auth');
        return;
      }

      logger.error('Error procesando webhook de pago', { email, producto, error: mensaje });
      res.status(500).send('Error interno');
    }
  }
);
