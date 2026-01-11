
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lyhzsxokbnkxlxfdbuon.supabase.co';
const supabaseKey = 'sb_publishable_ZuvCxpZOctaD4m2IzfAGqQ_uayVcxW-';

export const supabase = createClient(supabaseUrl, supabaseKey);
