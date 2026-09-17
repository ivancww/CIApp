(function (global) {
  "use strict";
  const KEYS = {
    hiddenCases:"AVA_CI_HIDDEN_CLOUD_CASE_IDS_V1",
    caseOverrides:"AVA_CI_CLOUD_CASE_OVERRIDES_V1",
    personalCases:"AVA_CI_PERSONAL_CASES_V1",
    hiddenDocuments:"AVA_CI_HIDDEN_CLOUD_DOCUMENT_IDS_V1",
    personalDocuments:"AVA_CI_PERSONAL_DOCUMENT_METADATA_V1"
  };
  const objectUrls = new Map();

  function read(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key) || "null"); return value === null ? fallback : value; }
    catch (error) { console.warn("Unable to read CI personal data", key, error); return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (error) { console.warn("Unable to save CI personal data", key, error); }
  }
  function esc(value) { return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char])); }
  function idFor(category, item, index) {
    const raw = `${category}|${item?.caseName || ""}|${index}`;
    let hash = 2166136261;
    for (let i=0;i<raw.length;i+=1) hash = Math.imul(hash ^ raw.charCodeAt(i),16777619);
    return `ci-cloud-${(hash>>>0).toString(36)}`;
  }
  function officialRows() {
    const rows=[];
    ["case","102","child","sce","oys2"].forEach(category => (cloudAppDatabase[category] || []).forEach((item,index) => rows.push({ ...item, category, id:idFor(category,item,index) })));
    return rows;
  }
  function documentRows() { return officialRows().filter(item => item.category === "sce" || item.category === "oys2"); }

  function renderCases() {
    const cloudBox=document.getElementById("ciCloudCasesManager");
    const personalBox=document.getElementById("ciPersonalCasesManager");
    if (!cloudBox || !personalBox) return;
    const hidden=new Set(read(KEYS.hiddenCases,[]));
    const overrides=read(KEYS.caseOverrides,{});
    cloudBox.innerHTML=officialRows().filter(item => item.category !== "sce" && item.category !== "oys2").map(item => `<article class="ava-library-item"><label class="ava-library-toggle"><input type="checkbox" ${hidden.has(item.id)?"":"checked"} onchange="CIManagement.toggleOfficialCase('${item.id}',this.checked)">顯示</label><label class="admin-label">個人顯示名稱</label><input type="text" value="${esc(overrides[item.id]?.caseName || item.caseName)}" onchange="CIManagement.overrideOfficialCase('${item.id}',this.value)"><p class="ava-library-meta">${esc(item.category)}｜Admin Cloud Default</p><div class="ava-library-actions"><button type="button" class="ava-library-btn" onclick="CIManagement.clearCaseOverride('${item.id}')">還原官方內容</button></div></article>`).join("") || '<p class="ava-library-help">目前沒有雲端案例。</p>';
    personalBox.innerHTML=read(KEYS.personalCases,[]).map(item => `<article class="ava-library-item"><div class="ava-library-title">${esc(item.caseName)}</div><p class="ava-library-meta">${esc(item.category)}｜私人案例</p><div class="ava-library-actions"><button type="button" class="ava-library-btn" onclick="CIManagement.editPersonalCase('${item.id}')">修改</button><button type="button" class="ava-library-btn" onclick="CIManagement.deletePersonalCase('${item.id}')">刪除</button></div></article>`).join("") || '<p class="ava-library-help">尚未新增私人案例。</p>';
  }

  function renderDocuments() {
    const cloudBox=document.getElementById("ciCloudDocumentsManager");
    const personalBox=document.getElementById("ciPersonalDocumentsManager");
    if (!cloudBox || !personalBox) return;
    const hidden=new Set(read(KEYS.hiddenDocuments,[]));
    cloudBox.innerHTML=documentRows().map(item => `<article class="ava-library-item"><label class="ava-library-toggle"><input type="checkbox" ${hidden.has(item.id)?"":"checked"} onchange="CIManagement.toggleOfficialDocument('${item.id}',this.checked)">顯示</label><div class="ava-library-title">${esc(item.caseName)}</div><p class="ava-library-meta">${esc(item.category)}｜Admin Cloud Default</p></article>`).join("") || '<p class="ava-library-help">目前沒有雲端文件。</p>';
    personalBox.innerHTML=read(KEYS.personalDocuments,[]).map(item => `<article class="ava-library-item"><div class="ava-library-title">${esc(item.name)}</div><p class="ava-library-meta">${esc(item.category)}｜${esc(item.storageProvider === "local" ? "此裝置" : item.storageProvider)}${item.missingFile?"｜需要重新上載":""}</p><div class="ava-library-actions"><button type="button" class="ava-library-btn" onclick="CIManagement.openPersonalDocument('${item.id}')">開啟</button><button type="button" class="ava-library-btn" onclick="CIManagement.deletePersonalDocument('${item.id}')">刪除</button></div></article>`).join("") || '<p class="ava-library-help">尚未上載私人文件。</p>';
  }

  const originalGetCaseList=global.getCaseList;
  global.getCaseList=function(category) {
    const original=(cloudAppDatabase[category] || []).map((item,index) => ({ ...item, id:idFor(category,item,index), source:"cloud" }));
    const hidden=new Set(read(category === "sce" || category === "oys2" ? KEYS.hiddenDocuments : KEYS.hiddenCases,[]));
    const overrides=read(KEYS.caseOverrides,{});
    const cloud=original.filter(item => !hidden.has(item.id)).map(item => ({ ...item, ...(overrides[item.id] || {}) }));
    const cases=read(KEYS.personalCases,[]).filter(item => item.category === category);
    const documents=read(KEYS.personalDocuments,[]).filter(item => item.category === category && objectUrls.has(item.id));
    if (documents.length) cases.push({ id:`personal-docs-${category}`, caseName:"我的私人文件", source:"local", files:documents.map(item => ({ title:item.name, type:item.mimeType === "application/pdf" ? "pdf" : "image", url:objectUrls.get(item.id) })) });
    const effective=cloud.concat(cases);
    if (effective.length || original.length) return effective;
    return originalGetCaseList(category);
  };

  const originalOpenAdmin=global.openAdminModal;
  global.openAdminModal=function() { originalOpenAdmin(); renderCases(); renderDocuments(); };
  const originalSwitch=global.switchAdminTab;
  global.switchAdminTab=function(tabKey,button) {
    originalSwitch(tabKey,button);
    const caseSection=document.getElementById("adminTabUserCasesSection");
    const documentSection=document.getElementById("adminTabDocumentsSection");
    if (caseSection) caseSection.style.display=tabKey === "userCases" ? "block" : "none";
    if (documentSection) documentSection.style.display=tabKey === "documents" ? "block" : "none";
    if (tabKey === "userCases") renderCases();
    if (tabKey === "documents") renderDocuments();
  };

  const originalPageUpload=global.uploadSingleImageToFirebase;
  global.uploadSingleImageToFirebase=async function(input,pageIdx) {
    if (isAdminMaster) return originalPageUpload(input,pageIdx);
    const file=input.files?.[0]; if (!file) return;
    const saved=await AVAStorage.saveFile("local",file,{module:"CIApp",purpose:"page-image"});
    const url=URL.createObjectURL(file);
    const page=dbData.pages[pageIdx];
    if (page) { page.imageUrl=url; page.privateImage={storageProvider:saved.providerId,reference:saved.reference,name:file.name,mimeType:file.type}; }
    const text=document.getElementById(`admPageImg_${pageIdx}`); if (text) text.value=url;
    alert("✅ 私人圖片只儲存在此裝置，沒有上載至 AVA Firebase。請按『保存至本機』完成。");
  };
  const originalOfficialUpload=global.uploadFileToFirebase;
  global.uploadFileToFirebase=function() { if (!isAdminMaster) { alert("⛔ 官方 Firebase 上載只限已驗證管理員。私人檔案請使用『我的文件』。"); return; } return originalOfficialUpload(); };
  const originalOfficialDelete=global.deleteAdminCaseItem;
  global.deleteAdminCaseItem=function(category,index) { if (!isAdminMaster) { alert("⛔ 你可以隱藏官方項目，但不能刪除 Admin Cloud Data。"); return; } return originalOfficialDelete(category,index); };

  async function hydratePrivateData() {
    for (const item of read(KEYS.personalDocuments,[])) {
      if (item.missingFile) continue;
      try { const blob=await AVAStorage.resolveFile(item.storageProvider,item.reference); if (blob) objectUrls.set(item.id,URL.createObjectURL(blob)); }
      catch (error) { console.warn("Unable to resolve private CI document",error); }
    }
    for (const page of (dbData.pages || [])) {
      if (!page.privateImage?.reference) continue;
      try { const blob=await AVAStorage.resolveFile(page.privateImage.storageProvider,page.privateImage.reference); if (blob) page.imageUrl=URL.createObjectURL(blob); }
      catch (error) { console.warn("Unable to resolve private CI image",error); }
    }
    if (typeof renderAllDynamicCards === "function") renderAllDynamicCards();
  }

  const api={
    renderCases,renderDocuments,
    toggleOfficialCase(id,shown){const hidden=new Set(read(KEYS.hiddenCases,[]));shown?hidden.delete(id):hidden.add(id);write(KEYS.hiddenCases,[...hidden]);},
    overrideOfficialCase(id,caseName){const data=read(KEYS.caseOverrides,{});data[id]={...(data[id]||{}),caseName};write(KEYS.caseOverrides,data);},
    clearCaseOverride(id){const data=read(KEYS.caseOverrides,{});delete data[id];write(KEYS.caseOverrides,data);renderCases();},
    addPersonalCase(){const caseName=prompt("案例名稱：");if(!caseName)return;const category=prompt("分類（case／102／child）：","case")||"case";const list=read(KEYS.personalCases,[]);list.push({id:`ci-personal-case-${Date.now()}`,caseName,category,files:[],source:"local",createdAt:new Date().toISOString()});write(KEYS.personalCases,list);renderCases();},
    editPersonalCase(id){const list=read(KEYS.personalCases,[]),item=list.find(x=>x.id===id);if(!item)return;const name=prompt("案例名稱：",item.caseName);if(!name)return;item.caseName=name;write(KEYS.personalCases,list);renderCases();},
    deletePersonalCase(id){if(!confirm("確定刪除此私人案例？"))return;write(KEYS.personalCases,read(KEYS.personalCases,[]).filter(x=>x.id!==id));renderCases();},
    toggleOfficialDocument(id,shown){const hidden=new Set(read(KEYS.hiddenDocuments,[]));shown?hidden.delete(id):hidden.add(id);write(KEYS.hiddenDocuments,[...hidden]);},
    async uploadPersonalDocuments(input){
      const allowed=new Set(["application/pdf","image/jpeg","image/png","image/webp"]);const files=Array.from(input.files||[]).filter(file=>allowed.has(file.type));if(!files.length)return;
      const providers=await AVAStorage.getAvailableProviders({module:"CIApp",purpose:"personal"});const provider=providers.find(x=>x.id==="local")||providers[0];if(!provider){alert("目前沒有可用的私人儲存位置。");return;}
      const category=prompt("文件分類（sce／oys2／case）：","case")||"case";const list=read(KEYS.personalDocuments,[]);
      for(const file of files){const saved=await AVAStorage.saveFile(provider.id,file,{module:"CIApp"});const id=`ci-personal-document-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;list.push({id,name:file.name,category,mimeType:file.type,size:file.size,storageProvider:saved.providerId,reference:saved.reference,createdAt:saved.createdAt,source:"local"});objectUrls.set(id,URL.createObjectURL(file));}
      write(KEYS.personalDocuments,list);input.value="";renderDocuments();
    },
    async openPersonalDocument(id){const item=read(KEYS.personalDocuments,[]).find(x=>x.id===id);if(!item)return;const blob=await AVAStorage.resolveFile(item.storageProvider,item.reference);if(!blob){alert("⚠️ 檔案只存在原本裝置，請重新上載。");return;}global.open(URL.createObjectURL(blob),"_blank","noopener");},
    async deletePersonalDocument(id){if(!confirm("確定刪除此私人文件？"))return;const list=read(KEYS.personalDocuments,[]),item=list.find(x=>x.id===id);if(item)await AVAStorage.deletePersonalFile(item.storageProvider,item.reference);write(KEYS.personalDocuments,list.filter(x=>x.id!==id));objectUrls.delete(id);renderDocuments();}
  };
  global.CIManagement=Object.freeze(api);

  document.addEventListener("DOMContentLoaded",function(){
    const mode=new URLSearchParams(location.search).get("mode");
    setTimeout(()=>{hydratePrivateData();if(mode==="user")global.openAdminModal();if(mode==="admin"){global.openAdminModal();if(!isAdminMaster)promptAdminLogin();}},0);
  });
})(window);
