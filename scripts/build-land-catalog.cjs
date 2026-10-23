// Regenerate trusted server prices whenever the original land grid changes.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('estate.html','utf8');let source=html.split('<script>')[1].split('</script>')[0];
source=source.slice(0,source.indexOf('  // ---------- 이벤트'))+'\nwindow.catalog=landCells();})();';
const context={window:{L:{}},atob,Date,Math};vm.createContext(context);vm.runInContext(source,context);
const expected=JSON.stringify(Object.fromEntries(context.window.catalog.map(c=>[c.id,{base:c.base,near:c.near}])));
if(process.argv.includes('--check'))assert.equal(fs.readFileSync('land-catalog.json','utf8'),expected,'server catalogue differs from the estate grid');else fs.writeFileSync('land-catalog.json',expected);
console.log('Land catalogue:',context.window.catalog.length,'cells verified');
