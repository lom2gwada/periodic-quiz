import { supabase } from './supabase'

/** Vrai si le compte connecté est admin periodic-quiz (table periodic_admins, non gérable depuis
 *  l'appli — cf. migration). `false` pour tout le monde par défaut, y compris hors-ligne/erreur. */
export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_periodic_admin')
  if (error) return false
  return data === true
}
