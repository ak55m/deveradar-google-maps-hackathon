import { supabase } from "./supabaseClient";
import { getFingerprint } from "./fingerprint";

// Get or create user limits for current fingerprint
export async function getUserLimits() {
  const fingerprint = getFingerprint();
  console.log("Getting user limits for fingerprint:", fingerprint);
  
  let { data, error } = await supabase
    .from("user_limits")
    .select("*")
    .eq("fingerprint", fingerprint)
    .single();
  
  if (error && error.code === 'PGRST116') {
    // User doesn't exist, create new user limits
    console.log("Creating new user limits for fingerprint:", fingerprint);
    const { data: newUser, error: createError } = await supabase
      .from("user_limits")
      .upsert([{
        fingerprint,
        check_in_count: 0,
        max_check_ins: 5,
        is_online: true
      }], { 
        onConflict: 'fingerprint',
        ignoreDuplicates: false 
      })
      .select()
      .single();
    
    if (createError) {
      console.error("Error creating user limits:", createError);
      // Try to get the existing user one more time
      const { data: existingUser, error: retryError } = await supabase
        .from("user_limits")
        .select("*")
        .eq("fingerprint", fingerprint)
        .single();
      
      if (retryError) {
        console.error("Error getting user limits after retry:", retryError);
        return null;
      }
      
      return existingUser;
    }
    
    return newUser;
  }
  
  if (error) {
    console.error("Error getting user limits:", error);
    return null;
  }
  
  return data;
}

// Add developer check-in with fingerprint tracking
export async function addDeveloper(dev) {
  const fingerprint = getFingerprint();
  console.log("Adding developer with fingerprint:", fingerprint);
  
  // Check user limits first
  const userLimits = await getUserLimits();
  if (!userLimits) {
    throw new Error("Unable to get user limits");
  }
  
  if (userLimits.check_in_count >= userLimits.max_check_ins) {
    throw new Error(`You've reached your maximum check-ins (${userLimits.max_check_ins}). You can update your location or toggle online/offline status.`);
  }
  
  // Add developer with fingerprint
  const developerData = {
    ...dev,
    fingerprint,
    is_online: true
  };
  
  const { data, error } = await supabase
    .from("developers")
    .insert([developerData]);
  
  if (error) {
    console.error("Error adding developer:", error);
    throw error;
  }
  
  // Update user limits
  const { error: updateError } = await supabase
    .from("user_limits")
    .update({
      check_in_count: userLimits.check_in_count + 1,
      last_check_in: new Date().toISOString()
    })
    .eq("fingerprint", fingerprint);
  
  if (updateError) {
    console.error("Error updating user limits:", updateError);
  }
  
  console.log("Developer added successfully:", data);
  return data;
}

// Update developer location
export async function updateDeveloperLocation(developerId, latitude, longitude) {
  console.log("Updating developer location:", developerId, latitude, longitude);
  
  const { data, error } = await supabase
    .from("developers")
    .update({
      latitude,
      longitude,
      updated_at: new Date().toISOString()
    })
    .eq("id", developerId)
    .select();
  
  if (error) {
    console.error("Error updating developer location:", error);
    throw error;
  }
  
  console.log("Developer location updated:", data);
  return data;
}

// Toggle developer online/offline status
export async function toggleDeveloperStatus(developerId, isOnline) {
  console.log("Toggling developer status:", developerId, isOnline);
  
  const { data, error } = await supabase
    .from("developers")
    .update({
      is_online: isOnline,
      updated_at: new Date().toISOString()
    })
    .eq("id", developerId)
    .select();
  
  if (error) {
    console.error("Error toggling developer status:", error);
    throw error;
  }
  
  console.log("Developer status updated:", data);
  return data;
}

// Update developer profile (name, skills, communication)
export async function updateDeveloperProfile(developerId, updates) {
  console.log("Updating developer profile:", developerId, updates);
  
  const { data, error } = await supabase
    .from("developers")
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq("id", developerId)
    .select();
  
  if (error) {
    console.error("Error updating developer profile:", error);
    throw error;
  }
  
  console.log("Developer profile updated:", data);
  return data;
}

// Get developers for current fingerprint
export async function getMyDevelopers() {
  const fingerprint = getFingerprint();
  console.log("Getting developers for fingerprint:", fingerprint);
  
  let { data, error } = await supabase
    .from("developers")
    .select("*")
    .eq("fingerprint", fingerprint)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error getting my developers:", error);
    return [];
  }
  
  console.log("My developers:", data);
  return data || [];
}

// Subscribe to real-time updates
export function subscribeToDevelopers(callback) {
  console.log("Setting up real-time subscription...");
  return supabase
    .channel("realtime:developers")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "developers" },
      (payload) => {
        console.log("Real-time update received:", payload);
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log("Subscription status:", status);
    });
}

// Fetch all online developers
export async function getDevelopers() {
  console.log("Fetching online developers...");
  let { data, error } = await supabase
    .from("developers")
    .select("*")
    .eq("is_online", true)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching developers:", error);
    return [];
  }
  
  console.log("Online developers fetched:", data);
  return data || [];
}

// Get user limits for display
export async function getCurrentUserLimits() {
  const userLimits = await getUserLimits();
  if (!userLimits) {
    return {
      check_in_count: 0,
      max_check_ins: 5,
      is_online: true,
      can_check_in: true
    };
  }
  
  return {
    ...userLimits,
    can_check_in: userLimits.check_in_count < userLimits.max_check_ins
  };
} 