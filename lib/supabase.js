import { createClient } from "@supabase/supabase-js";
import config from "../config/index.js";

const supabase = createClient(
  config.supabase.url,
  config.supabase.secretKey
);

export async function getMeta(key) {
  const { data, error } = await supabase
    .from("meta").select("value").eq("key", key).single();
  if (error) throw error;
  return data;
}

export async function modifyMeta(key, updates) {
  const { data, error } = await supabase
    .from("meta").update(updates).eq("key", key).select().single();
  if (error) throw error;
  return data;
}

export async function schedulePost({ options }) {
  const { data, error } = await supabase
    .from("posts").insert(options).select().single();
  if (error) throw error;
  return data;
}

export async function unschedulePost(id) {
  const { data, error } = await supabase
    .from("posts").delete().eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function getPost(id) {
  const { data, error } = await supabase
    .from("posts").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function getPosts(sort = "due") {
  const { data, error } = await supabase
    .from("posts").select("*").order(sort, { ascending: true });
  if (error) throw error;
  return data;
}

export async function modifyPost(id, options) {
  const { data, error } = await supabase
    .from("posts").update(options).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export default supabase;
