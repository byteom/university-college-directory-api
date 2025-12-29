// Super fast bulk import script for colleges
// Uses batch inserts and skips already seeded records

import "dotenv/config";
import XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import prisma from "../lib/prisma.js";
import { createId } from "@paralleldrive/cuid2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CollegeRow {
  "Aishe Code": string;
  "Name": string;
  "State": string;
  "District": string;
  "Website"?: string;
  "Year Of Establishment"?: number;
  "Location"?: string;
  "College Type"?: string;
  "Management"?: string;
  "University Aishe Code"?: string;
  "University Name"?: string;
  "University Type"?: string;
}

const BATCH_SIZE = 500; // Insert 500 records at a time

async function fastSeedColleges(filePath: string) {
  console.log(`\n=== FAST BULK SEEDER ===\n`);
  console.log(`Reading Excel file: ${filePath}`);

  // Step 1: Read Excel
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<CollegeRow>(worksheet);

  console.log(`Total records in Excel: ${data.length}`);

  // Step 2: Get all existing aishe codes from DB (to skip already seeded)
  console.log(`\nFetching already seeded records...`);
  const existingColleges = await prisma.college.findMany({
    select: { aisheCode: true },
  });
  const existingAisheCodes = new Set(existingColleges.map((c) => c.aisheCode));
  console.log(`Already seeded: ${existingAisheCodes.size} colleges`);

  // Step 3: Pre-load all universities (for linking)
  console.log(`Loading universities for linking...`);
  const universities = await prisma.university.findMany({
    select: { id: true, aisheCode: true, name: true },
  });
  const uniByAisheCode = new Map(universities.map((u) => [u.aisheCode, u.id]));
  const uniByName = new Map(universities.map((u) => [u.name.toLowerCase(), u.id]));
  console.log(`Loaded ${universities.length} universities\n`);

  // Step 4: Filter and prepare only NEW records
  const newColleges = data
    .map((row) => {
      const aisheCode = String(row["Aishe Code"] || "").trim();
      if (!aisheCode || existingAisheCodes.has(aisheCode)) {
        return null; // Skip if already seeded or invalid
      }

      const name = String(row["Name"] || "").trim();
      const state = String(row["State"] || "").trim();
      const district = String(row["District"] || "").trim();

      if (!name || !state || !district) {
        return null; // Skip invalid records
      }

      // Find university ID
      let universityId: string | null = null;
      const uniAisheCode = row["University Aishe Code"]
        ? String(row["University Aishe Code"]).trim()
        : null;
      const uniName = row["University Name"]
        ? String(row["University Name"]).trim()
        : null;

      if (uniAisheCode && uniByAisheCode.has(uniAisheCode)) {
        universityId = uniByAisheCode.get(uniAisheCode)!;
      } else if (uniName && uniByName.has(uniName.toLowerCase())) {
        universityId = uniByName.get(uniName.toLowerCase())!;
      }

      return {
        id: createId(),
        aisheCode,
        name,
        state,
        district,
        website: row["Website"] ? String(row["Website"]).trim() : null,
        yearOfEstablishment: row["Year Of Establishment"]
          ? parseInt(String(row["Year Of Establishment"]))
          : null,
        location: row["Location"] ? String(row["Location"]).trim() : null,
        collegeType: row["College Type"]
          ? String(row["College Type"]).trim()
          : null,
        management: row["Management"]
          ? String(row["Management"]).trim()
          : null,
        universityAisheCode: uniAisheCode,
        universityName: uniName,
        universityType: row["University Type"]
          ? String(row["University Type"]).trim()
          : null,
        universityId,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  console.log(`New colleges to seed: ${newColleges.length}`);
  console.log(`Skipping: ${data.length - newColleges.length} (already seeded or invalid)\n`);

  if (newColleges.length === 0) {
    console.log("Nothing to seed - all records already exist!");
    return;
  }

  // Step 5: Bulk insert in batches
  console.log(`Starting bulk insert (batch size: ${BATCH_SIZE})...\n`);
  const startTime = Date.now();
  let inserted = 0;

  for (let i = 0; i < newColleges.length; i += BATCH_SIZE) {
    const batch = newColleges.slice(i, i + BATCH_SIZE);

    try {
      await prisma.college.createMany({
        data: batch,
        skipDuplicates: true,
      });
      inserted += batch.length;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (inserted / parseFloat(elapsed)).toFixed(0);
      console.log(
        `Progress: ${inserted}/${newColleges.length} (${rate} records/sec)`
      );
    } catch (error: any) {
      console.error(`Batch error at ${i}: ${error.message}`);
      // Try one-by-one for this batch to find the problematic record
      for (const college of batch) {
        try {
          await prisma.college.create({ data: college });
          inserted++;
        } catch (e: any) {
          console.error(`  Skip: ${college.aisheCode} - ${e.message}`);
        }
      }
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== COMPLETE ===`);
  console.log(`Inserted: ${inserted} colleges`);
  console.log(`Time: ${totalTime} seconds`);
  console.log(`Rate: ${(inserted / parseFloat(totalTime)).toFixed(0)} records/sec`);
}

async function main() {
  const filePath =
    process.argv[2] ||
    path.join(__dirname, "../../data/College-Affiliated College.xlsx");

  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  try {
    await fastSeedColleges(absolutePath);
  } catch (error) {
    console.error("Fatal error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
