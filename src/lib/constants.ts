/** How many new question sets a student is offered at a time (the brief asks for 3–5). */
export const NEW_SETS_BATCH_SIZE = 5

/** Largest page a non-admin may request from the question set API (anti-scraping). */
export const MAX_SETS_PER_REQUEST = 20

/** Question set reads allowed per non-admin user per window (anti-scraping). */
export const SET_READS_PER_WINDOW = 150
export const SET_READS_WINDOW_MS = 15 * 60 * 1000

export const SITE_NAME = "Let's Talk English"
