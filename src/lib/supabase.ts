import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kzuwfagiqsvpjlcVknfa.supabase.co';
const supabaseKey = 'sb_publishable_8OxYsKE-ReYtxAnPASliFQ_STY0F9F4';

export const supabase = createClient(supabaseUrl, supabaseKey);