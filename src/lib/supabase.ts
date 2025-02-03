import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://omzrvobipzawytgnfyhi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tenJ2b2JpcHphd3l0Z25meWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyOTAyNTQsImV4cCI6MjA1Mzg2NjI1NH0.4WBC7GXnTWFIh6UbiXYo3WOcRSwzegPQLe3aq4xx8YU';

export const supabase = createClient(supabaseUrl, supabaseKey);