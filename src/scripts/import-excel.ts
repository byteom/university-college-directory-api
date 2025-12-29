// excel import script for universities and colleges

import "dotenv/config";
import XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import prisma from "../lib/prisma.js";

interface UniversityRow {
  "Aishe Code": string;
  "Name": string;
  "State": string;
  "District": string;
  "Website"?: string;
  "Year Of Establishment"?: number;
  "Location"?: string;
}

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

function parseArgs(): { type: "universities" | "colleges"; file: string } {
  const args = process.argv.slice(2);
  const typeArg = args.find((arg) => arg.startsWith("--type="));
  const fileArg = args.find((arg) => arg.startsWith("--file="));

  if (!typeArg || !fileArg) {
    console.error("Usage: npx tsx src/scripts/import-excel.ts --type=<universities|colleges> --file=<path>");
    process.exit(1);
  }

  const type = typeArg.split("=")[1] as "universities" | "colleges";
  const file = fileArg.split("=")[1];

  if (type !== "universities" && type !== "colleges") {
    console.error("Type must be 'universities' or 'colleges'");
    process.exit(1);
  }

  return { type, file };
}

async function importUniversities(filePath: string) {
  console.log(`📖 Reading Excel file: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<UniversityRow>(worksheet);

  console.log(`📊 Found ${data.length} universities to import`);

  const universities = data.map((row) => ({
    aisheCode: String(row["Aishe Code"] || "").trim(),
    name: String(row["Name"] || "").trim(),
    state: String(row["State"] || "").trim(),
    district: String(row["District"] || "").trim(),
    website: row["Website"] ? String(row["Website"]).trim() : null,
    yearOfEstablishment: row["Year Of Establishment"] 
      ? parseInt(String(row["Year Of Establishment"])) 
      : null,
    location: row["Location"] ? String(row["Location"]).trim() : null,
  })).filter((u) => u.aisheCode && u.name && u.state && u.district);

  console.log(`✅ ${universities.length} valid universities after filtering`);

  let created = 0;
  let skipped = 0;

  for (const university of universities) {
    try {
      await prisma.university.upsert({
        where: { aisheCode: university.aisheCode },
        update: university,
        create: university,
      });
      created++;
      if (created % 100 === 0) {
        console.log(`   Progress: ${created}/${universities.length}`);
      }
    } catch (error: any) {
      console.error(`   ⚠️ Error importing ${university.name}: ${error.message}`);
      skipped++;
    }
  }

  console.log(`\n🎉 Import complete!`);
  console.log(`   ✅ Created/Updated: ${created}`);
  console.log(`   ⚠️ Skipped: ${skipped}`);
}

async function importColleges(filePath: string) {
  console.log(`📖 Reading Excel file: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<CollegeRow>(worksheet);

  console.log(`📊 Found ${data.length} colleges to import`);

  const colleges = data.map((row) => ({
    aisheCode: String(row["Aishe Code"] || "").trim(),
    name: String(row["Name"] || "").trim(),
    state: String(row["State"] || "").trim(),
    district: String(row["District"] || "").trim(),
    website: row["Website"] ? String(row["Website"]).trim() : null,
    yearOfEstablishment: row["Year Of Establishment"] 
      ? parseInt(String(row["Year Of Establishment"])) 
      : null,
    location: row["Location"] ? String(row["Location"]).trim() : null,
    collegeType: row["College Type"] ? String(row["College Type"]).trim() : null,
    management: row["Management"] ? String(row["Management"]).trim() : null,
    universityAisheCode: row["University Aishe Code"] ? String(row["University Aishe Code"]).trim() : null,
    universityName: row["University Name"] ? String(row["University Name"]).trim() : null,
    universityType: row["University Type"] ? String(row["University Type"]).trim() : null,
  })).filter((c) => c.aisheCode && c.name && c.state && c.district);

  console.log(`✅ ${colleges.length} valid colleges after filtering`);

  let created = 0;
  let skipped = 0;

  for (const college of colleges) {
    try {
      // link university by aishe code or name
      let universityId = null;
      if (college.universityAisheCode) {
        const university = await prisma.university.findUnique({
          where: { aisheCode: college.universityAisheCode },
        });
        if (university) {
          universityId = university.id;
        }
      } else if (college.universityName) {
        const university = await prisma.university.findFirst({
          where: { name: { contains: college.universityName, mode: "insensitive" } },
        });
        if (university) {
          universityId = university.id;
        }
      }
      
      await prisma.college.upsert({
        where: { aisheCode: college.aisheCode },
        update: { ...college, universityId },
        create: { ...college, universityId },
      });
      created++;
      if (created % 100 === 0) {
        console.log(`   Progress: ${created}/${colleges.length}`);
      }
    } catch (error: any) {
      console.error(`   ⚠️ Error importing ${college.name}: ${error.message}`);
      skipped++;
    }
  }

  console.log(`\n🎉 Import complete!`);
  console.log(`   ✅ Created/Updated: ${created}`);
  console.log(`   ⚠️ Skipped: ${skipped}`);
}

async function main() {
  const { type, file } = parseArgs();

  const absolutePath = path.resolve(file);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ File not found: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`\n🎓 College API - Excel Import Tool`);
  console.log(`${"=".repeat(40)}`);
  console.log(`Type: ${type}`);
  console.log(`File: ${absolutePath}\n`);

  try {
    if (type === "universities") {
      await importUniversities(absolutePath);
    } else {
      await importColleges(absolutePath);
    }
  } catch (error) {
    console.error("❌ Import failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
