import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

async function buildZip() {
  const zip = new JSZip();

  const codePath = path.resolve('public/samples/alex_auth_complete_solution.py');
  const reportPath = path.resolve('public/samples/intern_task_submission_report.md');

  const codeContent = fs.readFileSync(codePath, 'utf8');
  const reportContent = fs.readFileSync(reportPath, 'utf8');

  zip.file('auth_service.py', codeContent);
  zip.file('README.md', reportContent);
  zip.file('requirements.txt', 'bcrypt>=4.0.1\nPyJWT>=2.8.0\npytest>=8.0.0\n');
  zip.file('tests/test_auth.py', codeContent);

  const outPath = path.resolve('public/samples/intern_auth_project_archive.zip');
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(outPath, buffer);
  console.log(`Created ZIP archive successfully at ${outPath} (${buffer.length} bytes)`);
}

buildZip().catch(console.error);
