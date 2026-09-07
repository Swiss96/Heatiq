
document.querySelectorAll('#serviceForm').forEach(form=>{
  form.addEventListener('submit',e=>{
    e.preventDefault();
    if(!form.checkValidity()){
      form.reportValidity();
      return;
    }
    const data = new FormData(form);
    // Frontend-Vorlage: Backend/CRM kann später an dieser Stelle angebunden werden.
    console.log("HeatIQ form submission", Object.fromEntries([...data.entries()].filter(([k,v]) => !(v instanceof File))));
    form.style.display='none';
    document.getElementById('success')?.classList.add('show');
    window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
  });
});
