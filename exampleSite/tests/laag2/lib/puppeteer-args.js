// Vlaggen voor puppeteer.launch(). Zonder sandbox start Chromium niet in CI of
// als root; met de GPU uit rastert elke machine hetzelfde beeld.
const BASIS_ARGS = ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"];

// Blink telt preferredColorScheme andersom dan je zou denken: 0 is donker, 1 is licht.
// Zonder vlag volgt headless Chrome de instelling van het systeem, en dan hangt de
// uitslag af van de machine waarop je draait.
export const LICHT_ARGS = [...BASIS_ARGS, "--blink-settings=preferredColorScheme=1"];
export const DONKER_ARGS = [...BASIS_ARGS, "--blink-settings=preferredColorScheme=0"];
export const PUPPETEER_ARGS = LICHT_ARGS;
