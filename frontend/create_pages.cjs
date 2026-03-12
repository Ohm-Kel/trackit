const fs = require('fs');
const path = require('path');

const pages = [
  'Dashboard', 'Exams', 'Chat', 'Upload', 'Tasks', 
  'FocusPlan', 'Analytics', 'Add', 'Settings'
];

const dir = path.join(__dirname, 'src', 'pages');

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

pages.forEach(page => {
  const content = `export default function ${page}() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-text-1">${page}</h1>
      <p className="text-text-3 mt-2">This is the ${page} placeholder.</p>
    </div>
  );
}
`;
  fs.writeFileSync(path.join(dir, `${page}.jsx`), content);
});

console.log('Pages created successfully.');
