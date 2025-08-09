
(function(){
  const params = new URLSearchParams(location.search);
  const q = (params.get('q') || '').trim().toUpperCase();
  const searchContainer = document.getElementById('search-results');
  if(!searchContainer) return;
  fetch('/data/batteries.json')
    .then(r => r.json())
    .then(list => {
      if(!q) {
        searchContainer.innerHTML = '<p>Type a code in the search box above.</p>';
        return;
      }
      const matches = list.filter(b => 
        b.code.toUpperCase().includes(q) ||
        (b.names || []).some(n => n.toUpperCase().includes(q))
      );
      if(matches.length === 0) {
        searchContainer.innerHTML = '<p>No results found. Try another code (e.g., LR44, CR2032).</p>';
        return;
      }
      const html = matches.map(b => '<li><a href="/battery/' + b.code + '">' + b.code + '</a> — ' + (b.names||[]).slice(0,6).join(', ') + '</li>').join('');
      searchContainer.innerHTML = '<ul>' + html + '</ul>';
    });
})();
