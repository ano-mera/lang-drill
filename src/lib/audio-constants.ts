/**
 * Audio constants and voice volume configuration for TOEIC listening parts
 */

import { Part3Question } from "@/lib/types";

// Voice ID-based volume adjustment (0.0-1.0 range)
export const PART3_VOICE_VOLUME_MAP: { [voiceId: string]: number } = {
  // American English voices
  "EXAVITQu4vr4xnSDxMaL": 0.5,  // American female (Sarah)
  "21m00Tcm4TlvDq8ikWAM": 1.0,  // American female (checked)
  "jsCqWAovK2LkecY7zXl4": 1.0,  // American female (checked)
  "z9fAnlkpzviPz146aGWa": 1.0,  // American female (checked)
  "pNInz6obpgDQGcFmaJgB": 0.3,  // American male (Adam)
  "VR6AewLTigWG4xSOukaG": 0.4,  // American male (checked)
  "5Q0t7uMcjvnagumLfvZi": 0.8,  // American male (checked)
  "N2lVS1w4EtoT3dr4eOWO": 0.9,  // American male (checked)

  // British English voices
  "ThT5KcBeYPX3keUQqHPh": 0.7,  // British female (checked)
  "XB0fDUnXU5powFXDhCwa": 1.0,  // British female (checked)
  "JBFqnCBsd6RMkjVDRZzb": 0.9,  // British female (checked)

  // Canadian English voices
  "1EZBFEhLjqjzuG8HBNbj": 0.5,  // Canadian female (checked)
  "AZnzlk1XvdvUeBnXmlld": 0.4,  // Canadian female (checked, deprecated)
  "w4Z9gYJrajAuQmheNbVn": 1.0,  // Canadian male (checked)
  "onwK4e9ZLuTAKqWW03F9": 0.7,  // Canadian male (checked, deprecated)

  // Australian English voices
  "p43fx6U8afP2xoq1Ai9f": 0.8,  // Australian female (checked)
  "IKne3meq5aSn9XLyUdCD": 0.9,  // Australian male (checked)
  "CYw3kZ02Hs0563khs1Fj": 0.8,  // Australian male (checked, deprecated)
};

// Default volume for Part 3/4 (when voiceId is not in the map)
export const DEFAULT_PART3_VOLUME = 0.7;

// Default volume for Part 2 (no voiceId)
export const DEFAULT_PART2_VOLUME = 0.4;

/**
 * Get voiceId from a Part3 speaker by their ID
 */
export const getVoiceIdFromSpeaker = (speakerId: string, speakers: Part3Question['speakers']): string | undefined => {
  const speaker = speakers?.find(s => s.id === speakerId);
  return speaker?.voiceProfile?.voiceId;
};
