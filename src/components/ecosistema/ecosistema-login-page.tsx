'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useEcosistema, type EcosistemaAccessMap } from '@/hooks/use-ecosistema';

const ACCESOS_FREE: EcosistemaAccessMap = {
  estacion_cs1: false,
  estacion_cs2: false,
  estacion_cs3: false,
  estacion_pfh1: false,
  preview_cap1: true,
  articulacion: true,
};

const ERRORES_ES: Record<string, string> = {
  'auth/user-not-found': 'No existe una cuenta con este correo.',
  'auth/wrong-password': 'Contrasena incorrecta.',
  'auth/email-already-in-use': 'Ya existe una cuenta con este correo.',
  'auth/weak-password': 'La contrasena debe tener al menos 6 caracteres.',
  'auth/invalid-email': 'Correo electronico no valido.',
  'auth/invalid-credential': 'Credenciales invalidas. Verifica tu correo y contrasena.',
  'auth/too-many-requests': 'Demasiados intentos. Intenta de nuevo mas tarde.',
  'auth/network-request-failed': 'Error de conexion. Verifica tu internet.',
};

function traducirError(code: string): string {
  return ERRORES_ES[code] || 'Ocurrio un error inesperado. Intenta de nuevo.';
}

export default function EcosistemaLoginPage() {
  const router = useRouter();
  const { estaAutenticado, cargando, perfil } = useEcosistema();

  const [tab, setTab] = useState<'ingresar' | 'registrarse'>('ingresar');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginCargando, setLoginCargando] = useState(false);

  const [registroNombre, setRegistroNombre] = useState('');
  const [registroEmail, setRegistroEmail] = useState('');
  const [registroPassword, setRegistroPassword] = useState('');
  const [registroError, setRegistroError] = useState('');
  const [registroCargando, setRegistroCargando] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [resetEnviado, setResetEnviado] = useState(false);
  const [resetError, setResetError] = useState('');
  const [mostrarReset, setMostrarReset] = useState(false);

  useEffect(() => {
    if (!cargando && estaAutenticado && perfil) {
      router.replace('/ecosistema');
    }
  }, [cargando, estaAutenticado, perfil, router]);

  async function handleCambiarCuenta() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('[EcosistemaLogin] Error cerrando sesion:', error);
    }
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setLoginError('');
    setLoginCargando(true);

    try {
      const normalizedEmail = loginEmail.trim().toLowerCase();
      await signInWithEmailAndPassword(auth, normalizedEmail, loginPassword);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code || '';
      setLoginError(traducirError(code));
    } finally {
      setLoginCargando(false);
    }
  }

  async function handleRegistro(event: FormEvent) {
    event.preventDefault();
    setRegistroError('');
    setRegistroCargando(true);

    const nombreLimpio = registroNombre.trim();

    try {
      const normalizedEmail = registroEmail.trim().toLowerCase();
      const credenciales = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        registroPassword
      );

      await setDoc(doc(db, 'ecosistema_usuarios', credenciales.user.uid), {
        uid: credenciales.user.uid,
        nombre: nombreLimpio,
        email: normalizedEmail,
        rol: 'lector_free',
        accesos: ACCESOS_FREE,
        fechaRegistro: serverTimestamp(),
        fechaExpiracion: null,
        activo: true,
      });

      void fetch('/api/ecosistema/notificar-registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreLimpio, email: normalizedEmail }),
      }).catch(() => {});
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code || '';
      setRegistroError(traducirError(code));
    } finally {
      setRegistroCargando(false);
    }
  }

  async function handleReset(event: FormEvent) {
    event.preventDefault();
    setResetError('');
    setResetEnviado(false);

    try {
      const normalizedEmail = resetEmail.trim().toLowerCase();
      await sendPasswordResetEmail(auth, normalizedEmail);
      setResetEnviado(true);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code || '';
      setResetError(traducirError(code));
    }
  }

  if (cargando) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'var(--papel)',
          fontFamily: 'var(--font-body)',
          color: 'var(--pardo)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid var(--crema)',
              borderTopColor: 'var(--pardo)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p>Verificando...</p>
          <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--papel)',
        fontFamily: 'var(--font-body)',
        padding: '2rem 1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 24px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #8b1a1a, #4a3728)',
            padding: '2rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 10,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#fdf8f0',
              fontFamily: 'var(--font-display)',
              marginBottom: '0.75rem',
            }}
          >
            LN
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#fdf8f0',
              margin: 0,
            }}
          >
            Letras Necias
          </h1>
          <p
            style={{
              color: 'rgba(253,248,240,0.7)',
              fontSize: '0.85rem',
              margin: '0.25rem 0 0',
            }}
          >
            Ecosistema de lectura
          </p>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #e8dcc8' }}>
          <button
            onClick={() => setTab('ingresar')}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              background: tab === 'ingresar' ? '#fdf8f0' : '#fff',
              fontWeight: tab === 'ingresar' ? 600 : 400,
              color: tab === 'ingresar' ? '#8b1a1a' : '#808080',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontFamily: 'var(--font-body)',
              borderBottom: tab === 'ingresar' ? '2px solid #8b1a1a' : '2px solid transparent',
            }}
          >
            Ingresar
          </button>
          <button
            onClick={() => setTab('registrarse')}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              background: tab === 'registrarse' ? '#fdf8f0' : '#fff',
              fontWeight: tab === 'registrarse' ? 600 : 400,
              color: tab === 'registrarse' ? '#8b1a1a' : '#808080',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontFamily: 'var(--font-body)',
              borderBottom: tab === 'registrarse' ? '2px solid #8b1a1a' : '2px solid transparent',
            }}
          >
            Registrarse
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {estaAutenticado && !perfil && (
            <div
              style={{
                border: '1px solid #e8dcc8',
                background: '#fff7ef',
                borderRadius: 8,
                padding: '0.75rem',
                marginBottom: '1rem',
                color: '#6e4a34',
                fontSize: '0.84rem',
              }}
            >
              La sesion actual no tiene perfil en Letras Necias. Cierra sesion para ingresar con otra cuenta o registrate.
              <button
                type="button"
                onClick={() => void handleCambiarCuenta()}
                style={{
                  display: 'block',
                  marginTop: '0.5rem',
                  background: 'none',
                  border: 'none',
                  color: '#8b1a1a',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Cerrar sesion y cambiar cuenta
              </button>
            </div>
          )}

          {tab === 'ingresar' && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#4a3728',
                    marginBottom: '0.35rem',
                  }}
                >
                  Correo electronico
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    border: '1px solid #d0c4b0',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-body)',
                    background: '#fdf8f0',
                    color: '#2a2a2a',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#4a3728',
                    marginBottom: '0.35rem',
                  }}
                >
                  Contrasena
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    border: '1px solid #d0c4b0',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-body)',
                    background: '#fdf8f0',
                    color: '#2a2a2a',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {loginError && (
                <p style={{ color: '#8b1a1a', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={loginCargando}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  background: loginCargando ? '#a0705a' : '#8b1a1a',
                  color: '#fdf8f0',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: loginCargando ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {loginCargando ? 'Ingresando...' : 'Ingresar'}
              </button>

              <button
                type="button"
                onClick={() => setMostrarReset(true)}
                style={{
                  display: 'block',
                  margin: '0.75rem auto 0',
                  background: 'none',
                  border: 'none',
                  color: '#8b1a1a',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  textDecoration: 'underline',
                }}
              >
                Olvidaste tu contrasena?
              </button>
            </form>
          )}

          {tab === 'registrarse' && (
            <form onSubmit={handleRegistro}>
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#4a3728',
                    marginBottom: '0.35rem',
                  }}
                >
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={registroNombre}
                  onChange={(event) => setRegistroNombre(event.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    border: '1px solid #d0c4b0',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-body)',
                    background: '#fdf8f0',
                    color: '#2a2a2a',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#4a3728',
                    marginBottom: '0.35rem',
                  }}
                >
                  Correo electronico
                </label>
                <input
                  type="email"
                  value={registroEmail}
                  onChange={(event) => setRegistroEmail(event.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    border: '1px solid #d0c4b0',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-body)',
                    background: '#fdf8f0',
                    color: '#2a2a2a',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#4a3728',
                    marginBottom: '0.35rem',
                  }}
                >
                  Contrasena
                </label>
                <input
                  type="password"
                  value={registroPassword}
                  onChange={(event) => setRegistroPassword(event.target.value)}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    border: '1px solid #d0c4b0',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-body)',
                    background: '#fdf8f0',
                    color: '#2a2a2a',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {registroError && (
                <p style={{ color: '#8b1a1a', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
                  {registroError}
                </p>
              )}

              <button
                type="submit"
                disabled={registroCargando}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  background: registroCargando ? '#a0705a' : '#8b1a1a',
                  color: '#fdf8f0',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: registroCargando ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {registroCargando ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>
          )}
        </div>

        {mostrarReset && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
            }}
            onClick={() => setMostrarReset(false)}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              style={{
                background: '#fff',
                borderRadius: 10,
                padding: '1.5rem',
                maxWidth: 380,
                width: '90%',
                fontFamily: 'var(--font-body)',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'var(--pardo)',
                  margin: '0 0 0.75rem',
                }}
              >
                Restablecer contrasena
              </h3>

              {resetEnviado ? (
                <p style={{ color: '#059669', fontSize: '0.9rem' }}>
                  Se envio un correo de restablecimiento. Revisa tu bandeja.
                </p>
              ) : (
                <form onSubmit={handleReset}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#4a3728',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Correo electronico
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(event) => setResetEmail(event.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        border: '1px solid #d0c4b0',
                        borderRadius: 6,
                        fontSize: '0.9rem',
                        fontFamily: 'var(--font-body)',
                        background: '#fdf8f0',
                        color: '#2a2a2a',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {resetError && (
                    <p style={{ color: '#8b1a1a', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
                      {resetError}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setMostrarReset(false)}
                      style={{
                        flex: 1,
                        padding: '0.55rem',
                        background: '#e8dcc8',
                        color: '#4a3728',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      style={{
                        flex: 1,
                        padding: '0.55rem',
                        background: '#8b1a1a',
                        color: '#fdf8f0',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      Enviar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}