export interface MigrationGuide {
  slug: "cronometer" | "lose-it" | "macrofactor" | "myfitnesspal";
  sourceName: string;
  title: string;
  description: string;
  summary: string;
  exportSteps: readonly string[];
  fileGuidance: string;
  caveat: string;
  officialExportUrl: string;
}

export const MIGRATION_GUIDES: readonly MigrationGuide[] = [
  {
    slug: "myfitnesspal",
    sourceName: "MyFitnessPal",
    title: "How to Import MyFitnessPal History into MacroTrackr",
    description:
      "Move your MyFitnessPal meal history into MacroTrackr from the official nutrition CSV export, with a preview before anything is saved.",
    summary:
      "Keep the history you already built, then continue tracking without banner ads or a barcode paywall.",
    exportSteps: [
      "In MyFitnessPal, open Nutrition or Progress and choose Export. On the website, open Reports and choose Export.",
      "Choose the date range, request the export, and download the ZIP file from the email MyFitnessPal sends you.",
      "Extract the ZIP and keep the nutrition CSV ready for MacroTrackr.",
    ],
    fileGuidance:
      "Upload the nutrition CSV. MacroTrackr shows the detected meals, date range, and totals before you confirm the import.",
    caveat:
      "MyFitnessPal currently limits file export to Premium and Premium+ accounts.",
    officialExportUrl:
      "https://support.myfitnesspal.com/hc/en-us/articles/360032273352-Data-Export-FAQs",
  },
  {
    slug: "cronometer",
    sourceName: "Cronometer",
    title: "How to Import Cronometer History into MacroTrackr",
    description:
      "Move Cronometer diary entries into MacroTrackr using Cronometer's CSV export and review the parsed meals before saving them.",
    summary:
      "Bring your diary history with you while moving to a faster, macro-focused tracker.",
    exportSteps: [
      "Open Cronometer Account Settings and find Account Data.",
      "Choose Export Data, select the date range, and export diary servings as CSV.",
      "Save the CSV without changing its column headings.",
    ],
    fileGuidance:
      "Upload the servings CSV. MacroTrackr detects dates, meal groups, foods, and macro totals for review.",
    caveat:
      "Use the servings export for meal-level history. A daily summary has less detail.",
    officialExportUrl:
      "https://support.cronometer.com/hc/en-us/articles/360018760151-Account-Settings",
  },
  {
    slug: "macrofactor",
    sourceName: "MacroFactor",
    title: "How to Import MacroFactor History into MacroTrackr",
    description:
      "Move MacroFactor nutrition history into MacroTrackr from a granular data export, with a full preview before import.",
    summary:
      "Retain your logged history and move to transparent targets with an open-source core.",
    exportSteps: [
      "In MacroFactor, tap More, then Data Management, then Data Export.",
      "Open Granular Export and select the nutrition data you want to move.",
      "Generate the spreadsheet and save the exported file to your device.",
    ],
    fileGuidance:
      "Upload the nutrition CSV or JSON export. MacroTrackr previews recognized meals and any weight values present in the file.",
    caveat:
      "Choose Granular Export for meal history; Quick Export is an aggregate progress summary.",
    officialExportUrl:
      "https://help.macrofactorapp.com/en/articles/68-export-your-data",
  },
  {
    slug: "lose-it",
    sourceName: "Lose It!",
    title: "How to Import Lose It! History into MacroTrackr",
    description:
      "Move Lose It! food history into MacroTrackr from the official account download and verify every detected meal before saving.",
    summary:
      "Bring your existing logs into an ad-free tracker with custom macro targets and optional self-hosting.",
    exportSteps: [
      "Sign in to my.loseit.com from a desktop web browser.",
      "Open loseit.com/export/data to start the full account download.",
      "Extract the download and keep the CSV containing your food log.",
    ],
    fileGuidance:
      "Upload the food-log CSV. MacroTrackr previews recognized foods, meal types, dates, and macro totals before import.",
    caveat:
      "Lose It! provides a full account export rather than a selectable food-log date range.",
    officialExportUrl:
      "https://loseit.zendesk.com/hc/en-us/articles/47497914864916-How-to-Download-Your-Data",
  },
];

export function getMigrationGuide(slug: string): MigrationGuide | null {
  return MIGRATION_GUIDES.find((guide) => guide.slug === slug) ?? null;
}
