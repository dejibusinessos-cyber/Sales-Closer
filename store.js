const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

function rowToConversation(row) {
  return {
    phone: row.phone,
    name: row.name,
    product: row.product,
    auto_reply: row.auto_reply,
    pending_reply: row.pending_reply,
    messages: row.messages || [],
    updated_at: row.updated_at,
  };
}

async function getConversation(phone) {
  const { data, error } = await supabase.from('conversations').select('*').eq('phone', phone).maybeSingle();

  if (error) throw new Error(`Supabase select failed: ${error.message}`);
  return data ? rowToConversation(data) : null;
}

async function getOrCreateConversation(phone, name) {
  const existing = await getConversation(phone);
  if (existing) return existing;

  const fresh = {
    phone,
    name: name || null,
    product: null,
    auto_reply: false,
    pending_reply: null,
    messages: [],
  };

  const { data, error } = await supabase.from('conversations').insert(fresh).select().single();

  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return rowToConversation(data);
}

async function saveConversation(convo) {
  convo.updated_at = new Date().toISOString();

  const { error } = await supabase.from('conversations').upsert({
    phone: convo.phone,
    name: convo.name,
    product: convo.product,
    auto_reply: convo.auto_reply,
    pending_reply: convo.pending_reply,
    messages: convo.messages,
    updated_at: convo.updated_at,
  });

  if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
  return convo;
}

async function listConversations() {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Supabase select failed: ${error.message}`);
  return (data || []).map(rowToConversation);
}

module.exports = { getConversation, getOrCreateConversation, saveConversation, listConversations };
