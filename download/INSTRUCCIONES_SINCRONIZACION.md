# Instrucciones para Arreglar la Sincronización con Firebase

## Problema Identificado

1. **Estado de sincronización parpadeante**: El estado cambiaba entre "pendiente" y "sincronizado" constantemente
2. **Grupo faltante**: El grupo "Conciencia Histórica IV TAEA" no se sincronizaba correctamente
3. **Causa raíz**: La función `uploadLocalToCloud` usaba el estado de React en lugar de leer directamente de IndexedDB

## Archivo a Modificar

`src/hooks/use-data.tsx`

---

## Cambio 1: Arreglar el monitoreo de sincronización (evitar parpadeo)

**Buscar esta sección (aproximadamente línea 745-765):**

```typescript
    // Monitor cloud sync status

    // Monitor cloud sync status
    useEffect(() => {
        const checkSyncStatus = async () => {
            try {
                setSyncStatus('pending');
                await waitForPendingWrites(db);
                setSyncStatus('synced');
            } catch (error) {
                console.error("Error checking sync status:", error);
                setSyncStatus('pending');
            }
        };

        // Check immediately and set up interval
        checkSyncStatus();
        const interval = setInterval(checkSyncStatus, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, []);
```

**REEMPLAZAR CON:**

```typescript
    // Monitor cloud sync status - improved to avoid flickering
    useEffect(() => {
        let isChecking = false;
        
        const checkSyncStatus = async () => {
            if (isChecking) return; // Prevent concurrent checks
            isChecking = true;
            
            try {
                await waitForPendingWrites(db);
                setSyncStatus('synced');
            } catch (error) {
                console.error("Error checking sync status:", error);
                // Only set to pending if it's a real error, not just offline
                if (error.code !== 'unavailable') {
                    setSyncStatus('pending');
                }
            } finally {
                isChecking = false;
            }
        };

        // Check after a short delay to let initial writes complete
        const timeoutId = setTimeout(() => {
            checkSyncStatus();
        }, 2000);
        
        const interval = setInterval(checkSyncStatus, 10000); // Check every 10 seconds (less frequent)

        return () => {
            clearTimeout(timeoutId);
            clearInterval(interval);
        };
    }, []);
```

---

## Cambio 2: Mejorar la función uploadLocalToCloud (SOLUCIÓN PRINCIPAL)

**Buscar esta sección (aproximadamente línea 1429-1495):**

```typescript
    // --- UPLOAD LOCAL DATA TO CLOUD ---
    // This function uploads ALL local data to Firebase, overwriting cloud data
    const uploadLocalToCloud = useCallback(async () => {
        try {
            setSyncStatus('syncing');
            toast({ title: "Subiendo datos a la nube...", description: "Guardando tu información en Firebase." });

            if (!user) {
                toast({ variant: "destructive", title: "Error", description: "Debes estar autenticado para sincronizar." });
                return;
            }

            const now = Date.now();
            
            // Upload all local data to cloud
            const uploadToCloud = async <T,>(key: string, data: T) => {
                try {
                    const docRef = doc(db, 'users', user.uid, 'userData', key);
                    const payload = { value: data, lastUpdated: now };
                    
                    await setDoc(docRef, payload, { merge: true });
                    
                    // Also update local cache with new timestamp
                    await set(key, payload);
                    
                    console.log(`✅ Subido ${key} a la nube`);
                    return true;
                } catch (error) {
                    console.error(`Error subiendo ${key}:`, error);
                    return false;
                }
            };

            // Upload all data in parallel
            const results = await Promise.all([
                uploadToCloud('app_groups', groups),
                uploadToCloud('app_students', allStudents),
                uploadToCloud('app_observations', allObservations),
                uploadToCloud('app_specialNotes', specialNotes),
                uploadToCloud('app_partialsData', allPartialsData),
                uploadToCloud('app_settings', settings),
            ]);

            const successCount = results.filter(r => r).length;
            const totalCount = results.length;

            if (successCount === totalCount) {
                setSyncStatus('synced');
                toast({ 
                    title: "✅ Datos subidos correctamente", 
                    description: `${successCount} colecciones sincronizadas. Tus datos ahora están disponibles en todos tus dispositivos.` 
                });
            } else {
                setSyncStatus('pending');
                toast({ 
                    variant: "destructive",
                    title: "Sincronización parcial", 
                    description: `Solo se subieron ${successCount} de ${totalCount} colecciones. Intenta de nuevo.` 
                });
            }

        } catch (error) {
            console.error("Error uploading to cloud:", error);
            setSyncStatus('pending');
            toast({ variant: "destructive", title: "Error de sincronización", description: "No se pudieron subir los datos a la nube." });
        }
    }, [user, groups, allStudents, allObservations, specialNotes, allPartialsData, settings, toast]);
```

**REEMPLAZAR CON:**

```typescript
    // --- UPLOAD LOCAL DATA TO CLOUD ---
    // This function uploads ALL local data to Firebase, overwriting cloud data
    // IMPORTANT: Reads directly from IndexedDB to ensure ALL local data is uploaded
    const uploadLocalToCloud = useCallback(async () => {
        try {
            setSyncStatus('syncing');
            toast({ title: "Subiendo datos a la nube...", description: "Leyendo datos locales y subiendo a Firebase." });

            if (!user) {
                toast({ variant: "destructive", title: "Error", description: "Debes estar autenticado para sincronizar." });
                return;
            }

            console.log("🔄 Iniciando subida de datos locales a Firebase...");
            console.log("👤 Usuario:", user.uid);

            const now = Date.now();
            
            // Helper to read directly from IndexedDB
            const readFromIndexedDB = async <T,>(key: string): Promise<{ value: T; lastUpdated: number } | null> => {
                try {
                    const data = await get(key);
                    if (data && typeof data === 'object' && 'value' in data) {
                        return data as { value: T; lastUpdated: number };
                    } else if (data) {
                        // Legacy format
                        return { value: data as T, lastUpdated: 0 };
                    }
                } catch (e) {
                    console.warn(`Error leyendo ${key} de IndexedDB:`, e);
                }
                return null;
            };
            
            // Upload all local data to cloud - reads DIRECTLY from IndexedDB
            const uploadToCloud = async <T,>(key: string, data: T, source: string) => {
                try {
                    console.log(`📤 Subiendo ${key}... (fuente: ${source})`);
                    const docRef = doc(db, 'users', user.uid, 'userData', key);
                    const payload = { value: data, lastUpdated: now };
                    
                    await setDoc(docRef, payload, { merge: true });
                    
                    // Also update local cache with new timestamp
                    await set(key, payload);
                    
                    console.log(`✅ Subido ${key} a la nube - ${Array.isArray(data) ? data.length + ' items' : 'objeto'}`);
                    return { success: true, count: Array.isArray(data) ? data.length : 1 };
                } catch (error) {
                    console.error(`❌ Error subiendo ${key}:`, error);
                    return { success: false, count: 0 };
                }
            };

            // Read ALL data directly from IndexedDB (not from React state)
            console.log("📖 Leyendo datos de IndexedDB...");
            
            const localGroups = await readFromIndexedDB<Group[]>('app_groups');
            const localStudents = await readFromIndexedDB<Student[]>('app_students');
            const localObservations = await readFromIndexedDB<{ [studentId: string]: StudentObservation[] }>('app_observations');
            const localSpecialNotes = await readFromIndexedDB<SpecialNote[]>('app_specialNotes');
            const localPartialsData = await readFromIndexedDB<AllPartialsData>('app_partialsData');
            const localSettings = await readFromIndexedDB<AppSettings>('app_settings');

            // Log what we found
            console.log("📊 Datos encontrados en IndexedDB:");
            console.log("  - Grupos:", localGroups?.value?.length || 0);
            if (localGroups?.value) {
                localGroups.value.forEach((g, i) => console.log(`    ${i+1}. ${g.groupName} (${g.id})`));
            }
            console.log("  - Estudiantes:", localStudents?.value?.length || 0);
            console.log("  - Observaciones:", Object.keys(localObservations?.value || {}).length, "estudiantes");
            console.log("  - Notas especiales:", localSpecialNotes?.value?.length || 0);
            console.log("  - Grupos en partialsData:", Object.keys(localPartialsData?.value || {}).length);

            // Upload each collection
            const results = [];
            
            if (localGroups) {
                results.push(await uploadToCloud('app_groups', localGroups.value, 'IndexedDB'));
                // Update React state too
                setGroupsState(localGroups.value);
            }
            
            if (localStudents) {
                results.push(await uploadToCloud('app_students', localStudents.value, 'IndexedDB'));
                setAllStudentsState(localStudents.value);
            }
            
            if (localObservations) {
                results.push(await uploadToCloud('app_observations', localObservations.value, 'IndexedDB'));
                setAllObservationsState(localObservations.value);
            }
            
            if (localSpecialNotes) {
                results.push(await uploadToCloud('app_specialNotes', localSpecialNotes.value, 'IndexedDB'));
                setSpecialNotesState(localSpecialNotes.value);
            }
            
            if (localPartialsData) {
                results.push(await uploadToCloud('app_partialsData', localPartialsData.value, 'IndexedDB'));
                setAllPartialsDataState(localPartialsData.value);
            }
            
            if (localSettings) {
                const normalizedSettings = normalizeSettingsValue(localSettings.value);
                results.push(await uploadToCloud('app_settings', normalizedSettings, 'IndexedDB'));
                setSettingsState(normalizedSettings);
            }

            const successCount = results.filter(r => r.success).length;
            const totalCount = results.length;

            console.log("🎯 Resultado de subida:", successCount, "/", totalCount, "exitosos");

            if (successCount === totalCount && totalCount > 0) {
                setSyncStatus('synced');
                toast({ 
                    title: "✅ Datos subidos correctamente", 
                    description: `${successCount} colecciones sincronizadas. ${localGroups?.value?.length || 0} grupos subidos. Tus datos ahora están disponibles en todos tus dispositivos.` 
                });
            } else if (totalCount === 0) {
                toast({ 
                    variant: "destructive",
                    title: "Sin datos locales", 
                    description: "No se encontraron datos en el almacenamiento local para subir." 
                });
            } else {
                setSyncStatus('pending');
                toast({ 
                    variant: "destructive",
                    title: "Sincronización parcial", 
                    description: `Solo se subieron ${successCount} de ${totalCount} colecciones. Revisa la consola para más detalles.` 
                });
            }

        } catch (error) {
            console.error("❌ Error uploading to cloud:", error);
            setSyncStatus('pending');
            toast({ variant: "destructive", title: "Error de sincronización", description: `No se pudieron subir los datos: ${error.message}` });
        }
    }, [user, toast]);
```

---

## Cómo Usar la Función Mejorada

Después de hacer los cambios:

1. **Abre la consola del navegador** (F12 → Console)
2. **Ve a Ajustes → Sincronización con la Nube**
3. **Haz clic en "Subir Datos Locales a la Nube"**
4. **Revisa la consola** - deberías ver mensajes como:
   ```
   🔄 Iniciando subida de datos locales a Firebase...
   📖 Leyendo datos de IndexedDB...
   📊 Datos encontrados en IndexedDB:
     - Grupos: 4
       1. Humanidades III TO (xxx)
       2. Humanidades III TSPP (xxx)
       3. Conciencia Histórica IV TAEA (xxx)
       4. Prueba 1 (xxx)
   ✅ Subido app_groups a la nube - 4 items
   ...
   🎯 Resultado de subida: 6 / 6 exitosos
   ```

---

## ¿Por qué esto soluciona el problema?

**El problema original:**
La función `uploadLocalToCloud` usaba `groups`, `allStudents`, etc. del estado de React. Si el estado no estaba sincronizado con IndexedDB, se perdían datos.

**La solución:**
Ahora la función lee **directamente de IndexedDB** usando `get(key)`, lo que garantiza que TODOS los datos almacenados localmente se suban a Firebase, incluyendo el grupo "Conciencia Histórica IV TAEA" que faltaba.
