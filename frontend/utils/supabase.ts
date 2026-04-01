import {createClient} from '@supabase/supabase-js';;

const supabaseUrl = 'https://adkkxqcodjjayivjzocx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFka2t4cWNvZGpqYXlpdmp6b2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNjI3MjUsImV4cCI6MjA3MjkzODcyNX0.qtpHGqlae4jGCK9wuFSWvFLP91UlQjF2xnKga51s1f8';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase