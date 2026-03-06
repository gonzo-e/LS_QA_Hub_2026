(function(){
  // ===== DOM =====
  var elHtml = document.getElementById("htmlInput");
  var elStatus = document.getElementById("status");
  var elFileSizeWarning = document.getElementById("fileSizeWarning");
  
  var elImagesBody = document.getElementById("imagesBody");
  var elImagesCount = document.getElementById("imagesCount");
  
  var elHeadlineWrap = document.getElementById("headlineCheckWrap");
  var elHeadlineResult = document.getElementById("headlineCheckResult");

  var elSkuLinksWrap = document.getElementById("skuLinksWrap");
  var elSkuLinksResult = document.getElementById("skuLinksResult");
  var btnCopySkuLinks = document.getElementById("btnCopySkuLinks");

  var emailFrame = document.getElementById("emailFrame");
  var safePreviewToggle = document.getElementById("safePreviewToggle");
  var previewDarkToggle = document.getElementById("previewDarkToggle");
  var imagesOffToggle = document.getElementById("imagesOffToggle");
  var rowNumbersToggle = document.getElementById("rowNumbersToggle");
  var fullUrlToggle = document.getElementById("fullUrlToggle");

  var btnRun = document.getElementById("btnRun");
  var btnPasteRun = document.getElementById("btnPasteRun");
  var btnClear = document.getElementById("btnClear");
  var btnScreenshot = document.getElementById("btnScreenshot");
  var btnExportLinks = document.getElementById("btnExportLinks");
  var btnExportImages = document.getElementById("btnExportImages");
  var btnCopySummary = document.getElementById("btnCopySummary");

  var revSummary = document.getElementById("revSummary");
  var copyStatus = document.getElementById("copyStatus");
  var toggleRevSummary = document.getElementById("toggleRevSummary");
  var revBox = document.querySelector(".revBox");

  toggleRevSummary.addEventListener("click", function() {
    revBox.classList.toggle("collapsed");
  });

  // ===== STATE =====
  var lastResults = { 
    links: [], 
    images: [], 
    headlines: [], 
    skuLinksData: [] 
  };

  // ===== IGNORE LISTS =====
  var IGNORED_IMAGE_URLS = {};
  [
    "https://cdn.brandfolder.io/XQW73PF4/at/f9xtm5htfbj6h5np3j683/250521_SocialHeaderBanner_imageIG.jpg",
    "https://cdn.brandfolder.io/XQW73PF4/at/jmb4wx9k9f6t9pm5q7sbgzx8/250521_SocialHeaderBanner_imageTT.jpg",
    "https://cdn.brandfolder.io/XQW73PF4/at/mn6k7sp3rc9vnfhspvnstn/250521_SocialHeaderBanner_followus.jpg",
    "https://cdn.brandfolder.io/XQW73PF4/as/ms89xbh4gvs6s5br4cpghqtv/231027_LivingSpacesLogo_Cart_000.jpg",
    "https://cdn.brandfolder.io/XQW73PF4/at/qppvc3v4mprx78ttmt8bpghk/1024_Free_Shipping_banner_furniture_v2.jpg",
    "https://cdn.brandfolder.io/XQW73PF4/at/rs2wcpb56htnz3xpt3bsgbc/230515_visual_PLP_nav_furniture_CTA.jpg",
    "https://cdn.brandfolder.io/XQW73PF4/at/53c96t8389jxnpmz4p2sgq7j/230515_visual_PLP_nav_outdoor_CTA.jpg",
    "https://cdn.brandfolder.io/XQW73PF4/at/s93fhzsn5hwp8qp9pjnhb2h/230515_visual_PLP_nav_clearance_CTA.jpg"
  ].forEach(function(u){ IGNORED_IMAGE_URLS[u] = true; });

  var IGNORED_FILENAMES = {};
  [
    "open",
    "230804_emailfooterrevamp2023_v4_tiktok_24.png",
    "230804_emailfooterrevamp2023_v4_ig_22.png",
    "230804_emailfooterrevamp2023_v4_pintrest_20.png",
    "250624_footer_instorecleance_cta.png",
    "250707_footer_your_local_store_lamirada.jpg",
    "250624_footer_category_image_clearance.jpg",
    "250624_footer_category_image_diningroom.jpg",
    "250624_footer_category_image_bedroom.jpg",
    "250624_footer_category_image_livingroom.jpg",
    "260223_spring_deals_email_banner.png",
    "230804_emailfooterrevamp2023_v4_catalog_04.auto",
    "250624_footer_sms_newcolor.jpg"
  ].forEach(function(f){ IGNORED_FILENAMES[f.toLowerCase()] = true; });

  var IGNORED_HEADLINE_PHRASES = [
    "get inspired",
    "living spaces furniture, llc",
    "view in browser | unsubscribe",
    "view in browser",
    "unsubscribe"
  ];

  // ===== HELPERS =====

  function decodeExponeaLink(url) {
    if (!url || typeof url !== 'string') return url;
    
    var match = url.match(/\/e\/\.([^/?#]+)/) || url.match(/\/click\/([^/?#]+)/);
    if (!match) return url;
    
    if (typeof pako === 'undefined') return url;

    try {
      var rawB64 = decodeURIComponent(match[1]).split('.')[0].trim();
      var b64 = rawB64.replace(/-/g, '+').replace(/_/g, '/');
      var pad = b64.length % 4;
      if (pad) { b64 += new Array(5 - pad).join('='); }
      
      var binStr = atob(b64);
      var arr = new Uint8Array(binStr.length);
      for (var i = 0; i < binStr.length; i++) {
        arr[i] = binStr.charCodeAt(i);
      }
      
      var decompressed = "";
      try { 
        decompressed = pako.inflate(arr, { to: 'string' }); 
      } catch (e1) {
        try { decompressed = pako.inflateRaw(arr, { to: 'string' }); } 
        catch (e2) { decompressed = binStr; }
      }
      
      var urlMatch = decompressed.match(/"(https?:\/\/[^"]+)"/);
      if (urlMatch) {
        return urlMatch[1].replace(/\\\//g, '/');
      }

      var strictMatch = decompressed.match(/(https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&*+,;=%]+)/);
      if (strictMatch) {
        return strictMatch[1];
      }

      return url;
    } catch(e) {
      return url; 
    }
  }

  function getFilename(url) {
    if (!url) return "";
    var cleanUrl = url.split("?")[0].split("#")[0];
    var parts = cleanUrl.split("/");
    return parts[parts.length - 1] || "";
  }

  function escHtml(s){
    return (s == null ? "" : String(s))
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function shortUrl(u){
    var raw = (u || "").trim();
    if (!raw) return "";
    try{
      var url = new URL(raw, "https://example.com");
      var host = url.host || "";
      var parts = (url.pathname || "").split("/").filter(Boolean);
      var last = parts.length ? parts[parts.length-1] : "";
      var compactLast = last.length > 20 ? (last.substring(0, 17) + "...") : last;
      return host + "/" + compactLast;
    }catch(e){ 
      return raw.substring(0, 30); 
    }
  }

  function generateCorrectedAlt(alt, src) {
    var clean = (alt || "").trim();
    if (!clean) {
      var fn = getFilename(src);
      fn = fn.replace(/\.[^/.]+$/, "");
      fn = fn.replace(/[_-]/g, " ");
      return fn.trim();
    }
    clean = clean.replace(/\s{2,}/g, " ");
    clean = clean.replace(/"/g, "");
    clean = clean.replace(/\.(png|jpe?g|gif|webp|svg|auto)$/i, "");
    return clean.trim();
  }

  function shouldIgnoreHeadline(text) {
    var cleanText = text.toLowerCase().replace(/\s+/g, " ").trim();
    return IGNORED_HEADLINE_PHRASES.some(function(phrase) {
      return cleanText.indexOf(phrase) !== -1;
    });
  }

  function toCSV(rows, headers){
    function q(v){ return '"' + String(v == null ? "" : v).replace(/"/g,'""') + '"'; }
    var lines = [];
    lines.push(headers.map(q).join(","));
    rows.forEach(function(r){
      lines.push(headers.map(function(h){ return q(r[h]); }).join(","));
    });
    return lines.join("\n");
  }

  function download(filename, text){
    var blob = new Blob([text], { type:"text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function getLinkFlags(href){
    var flags = [];
    var raw = (href || "").trim();
    if (!raw) flags.push({ level:"bad", text:"Missing href" });
    if (raw === "#" || /^#($|[^/])/i.test(raw)) flags.push({ level:"bad", text:"Placeholder (#)" });
    if (/^javascript:/i.test(raw)) flags.push({ level:"bad", text:"javascript:" });
    if (/^http:\/\//i.test(raw)) flags.push({ level:"warn", text:"http://" });
    return flags;
  }

  function getImgFlags(alt){
    var flags = [];
    var aRaw = (alt == null ? "" : String(alt));
    var aTrim = aRaw.trim();

    if (aTrim.length === 0) flags.push({ level:"bad", text:"Missing/empty alt" });
    if (/ {2,}/.test(aRaw)) flags.push({ level:"warn", text:"Double spaces in alt" });
    if (aRaw.indexOf('"') !== -1) flags.push({ level:"bad", text:'Double quote (") in alt' });
    if (aTrim && /\.(png|jpe?g|gif|webp|svg)$/i.test(aTrim)) flags.push({ level:"warn", text:"Alt looks like filename" });

    return flags;
  }

  // ===== FUNCTIONALITY =====

  function applyRowNumbers() {
    try {
      var doc = emailFrame.contentDocument || emailFrame.contentWindow.document;
      if (!doc) return;
      
      var existing = doc.querySelectorAll('.__qa_badge');
      existing.forEach(function(el) { el.remove(); });

      var style = doc.getElementById("__qa_row_style");
      if (!style) {
        style = doc.createElement("style");
        style.id = "__qa_row_style";
        style.textContent = `
          .__qa_badge {
            position: absolute !important;
            top: 2px !important;
            left: 2px !important;
            background: #9a3521 !important;
            color: #fff !important;
            padding: 2px 6px !important;
            font-family: sans-serif !important;
            font-size: 11px !important;
            font-weight: bold !important;
            z-index: 9999 !important;
            border-radius: 3px !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
            pointer-events: none !important;
          }
        `;
        doc.head.appendChild(style);
      }

      if (rowNumbersToggle.checked) {
        var imgs = doc.querySelectorAll('img');
        var counter = 1;
        imgs.forEach(function(img) {
          var fName = getFilename(img.getAttribute('src') || "").toLowerCase();
          var isIgnoredUrl = IGNORED_IMAGE_URLS[img.getAttribute('src') ? img.getAttribute('src').split('?')[0] : ""];
          
          if (!isIgnoredUrl && !IGNORED_FILENAMES[fName]) {
            var badge = doc.createElement('div');
            badge.className = '__qa_badge';
            badge.innerText = counter;
            
            var parent = img.parentElement;
            if (parent) { 
              parent.style.position = 'relative'; 
              parent.appendChild(badge); 
            }
            counter++;
          }
        });
      }
    } catch(e){}
  }

  function applyPreviewTheme(){
    try {
      var doc = emailFrame.contentDocument || emailFrame.contentWindow.document;
      if (!doc) return;
      
      var style = doc.getElementById("__qa_preview_theme");
      if (!style) {
        style = doc.createElement("style");
        style.id = "__qa_preview_theme";
        doc.head.appendChild(style);
      }
      
      if (previewDarkToggle.checked) {
        style.textContent = `
          html { background: #121212 !important; } 
          body { filter: invert(1) hue-rotate(180deg) !important; background: #fff !important; } 
          img { filter: invert(1) hue-rotate(180deg) !important; }
        `;
      } else { 
        style.textContent = `
          html { background: #fff !important; } 
          body { filter: none !important; }
        `; 
      }
    } catch(e){}
  }

  function setEmailPreview(html){
    var doc = emailFrame.contentDocument || emailFrame.contentWindow.document;
    doc.open(); 
    doc.write(html); 
    doc.close();
    
    applyPreviewTheme(); 
    applyRowNumbers();
    
    if (imagesOffToggle.checked) {
      var imgs = doc.querySelectorAll("img");
      imgs.forEach(function(img) {
        img.removeAttribute('src');
        img.style.border = "1px dashed #ccc";
      });
    }
  }

  function previewCellWithHover(src){
    var s = (src || "").trim();
    var filename = escHtml(getFilename(s));
    
    if (!s) {
      return '<div class="thumbCell"><div class="thumbWrap"><div class="thumbFallback">No src</div></div></div>';
    }
    
    var isAbs = /^https?:\/\//i.test(s) || /^data:image\//i.test(s);
    if (!isAbs) {
      return '<div class="thumbCell"><div class="thumbWrap"><div class="thumbFallback">Relative<br>src</div></div><div class="fileName" title="' + filename + '">' + filename + '</div></div>';
    }
    
    var safe = escHtml(s);
    return ''
      + '<div class="thumbCell">'
      +   '<div class="thumbWrap"><img class="thumb" src="' + safe + '" alt="" loading="lazy"></div>'
      +   '<div class="fileName" title="' + filename + '">' + filename + '</div>'
      +   '<div class="thumbPop"><img src="' + safe + '" alt="" loading="lazy"></div>'
      + '</div>';
  }

  function renderImagesTable(images){
    elImagesBody.innerHTML = images.map(function(im, i) {
      var rowClass = im.flags.length ? "rowBad" : "";
      var issuesText = im.flags.length ? im.flags.map(function(f) { return f.text; }).join(" | ") : "—";
      var hasAltIssue = im.flags.some(function(f) { return f.text.toLowerCase().indexOf("alt") !== -1; });
      var altCellHtml = "";

      if (hasAltIssue) {
        var corrected = generateCorrectedAlt(im.alt, im.src);
        var originalDisplay = im.alt ? escHtml(im.alt) : "(Empty)";
        altCellHtml = ''
          + '<div class="alt-original"><strong>Original:</strong> <span style="opacity: 0.7;">' + originalDisplay + '</span></div>'
          + '<div class="alt-corrected">'
          +   '<div class="corrected-text" contenteditable="true" spellcheck="true">' + escHtml(corrected) + '</div>'
          +   '<button class="copy-alt-btn">Copy Fix</button>'
          + '</div>';
      } else {
        altCellHtml = '<div class="alt-clean" contenteditable="true" spellcheck="true">' + escHtml(im.alt) + '</div>';
      }
      
      return ''
        + '<tr class="' + rowClass + '">'
        +   '<td>' + (i+1) + '</td>'
        +   '<td>' + previewCellWithHover(im.src) + '</td>'
        +   '<td class="linkCell">' + buildLinkCellHtml(im.href) + '</td>'
        +   '<td>' + escHtml(issuesText) + '</td>'
        +   '<td>' + altCellHtml + '</td>'
        + '</tr>';
    }).join("");
    
    elImagesCount.textContent = "(" + images.length + ")";
  }

  function buildLinkCellHtml(href){
    if (!href) return "—";
    var display = fullUrlToggle.checked ? href : shortUrl(href);
    return '<a href="' + escHtml(href) + '" target="_blank">' + escHtml(display) + '</a>';
  }

  function renderHeadlines(headlines) {
    if(!headlines.length) {
      elHeadlineWrap.style.display = "none";
      return;
    }
    elHeadlineWrap.style.display = "block";
    
    var html = headlines.map(function(hl) {
      var statusClass = hl.linked ? "yes" : "no";
      var statusText = hl.linked ? "Linked ✅" : "Not Linked ❌";
      var linkHtml = hl.linked ? '<a href="' + escHtml(hl.href) + '" target="_blank" class="hl-link">' + escHtml(shortUrl(hl.href)) + '</a>' : '';
      
      return ''
        + '<div class="hl-row">'
        +   '<div class="hl-left">'
        +     '<div class="hl-text">"' + escHtml(hl.text) + '"</div>'
        +     linkHtml
        +   '</div>'
        +   '<div class="hl-status ' + statusClass + '">' + statusText + '</div>'
        + '</div>';
    }).join("");
    
    elHeadlineResult.innerHTML = html;
  }

  // CHANGED: Now uses previewCellWithHover so you get the visual thumbnail too!
  function renderSkuLinks(skuLinksData) {
    if(!skuLinksData.length) {
      elSkuLinksWrap.style.display = "none";
      return;
    }
    elSkuLinksWrap.style.display = "block";

    var html = skuLinksData.map(function(item) {
      return ''
        + '<div style="display: flex; gap: 16px; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 12px;">'
        +   previewCellWithHover(item.url)
        +   '<div style="flex-grow: 1;">'
        +     '<a href="' + escHtml(item.url) + '" target="_blank" style="color:var(--brand); text-decoration:none; word-break: break-all; font-size: 12px; font-weight: 600;">' + escHtml(item.url) + '</a>'
        +   '</div>'
        + '</div>';
    }).join("");

    elSkuLinksResult.innerHTML = html;
  }

  function takeScreenshot() {
    var doc = emailFrame.contentDocument || emailFrame.contentWindow.document;
    if (!doc || !doc.body) {
        alert("Run QA first to load a preview!");
        return;
    }

    elStatus.textContent = "Generating high-res image... please wait.";
    
    html2canvas(doc.body, {
        useCORS: true, 
        allowTaint: true,
        scale: 2
    }).then(function(canvas) {
        var link = document.createElement('a');
        var timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        link.download = "LS-Email-QA-" + timestamp + ".png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        elStatus.textContent = "Screenshot saved to Downloads!";
    }).catch(function(err) {
        console.error(err);
        elStatus.textContent = "Screenshot failed. Check browser console for errors.";
    });
  }

  function runQA(){
    var html = elHtml.value || "";
    if (!html.trim()) return;
    
    if (typeof pako === 'undefined') {
        elStatus.innerHTML = "<span style='color:#9a3521; font-weight:bold;'>⚠️ IT Firewall is blocking the Decryption Library. Links will remain encoded.</span>";
    } else {
        elStatus.textContent = "Running QA Engine... please wait.";
    }

    var byteSize = new Blob([html]).size;
    if (byteSize > 102400) {
      elFileSizeWarning.innerHTML = '<span style="color:#9a3521; font-weight:700;">⚠️ File Size: ' + (byteSize/1024).toFixed(1) + ' KB (Exceeds Gmail 102KB limit - Email will clip!)</span>';
    } else {
      elFileSizeWarning.innerHTML = '<span style="color:#137333; font-weight:700;">✅ File Size: ' + (byteSize/1024).toFixed(1) + ' KB (Safe from Gmail clipping)</span>';
    }

    setEmailPreview(html);
    var doc = new DOMParser().parseFromString(html, "text/html");
    
    var emailTitle = doc.querySelector("title");
    document.getElementById("inboxSubject").textContent = emailTitle ? emailTitle.textContent : "(No Subject Found)";
    
    var bodyClone = doc.body.cloneNode(true);
    var scriptStyles = bodyClone.querySelectorAll("style, script, xml");
    scriptStyles.forEach(function(el){ el.remove(); });
    var rawText = bodyClone.textContent.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "").replace(/\s+/g, " ").trim();
    var preheader = rawText.substring(0, 90) + (rawText.length > 90 ? "..." : "");
    document.getElementById("inboxPreheader").textContent = preheader || "(No Preheader Text Found)";

    var linkEls = doc.querySelectorAll("a");
    var links = [];
    for (var i=0; i<linkEls.length; i++){
      var a = linkEls[i];
      var rawHref = a.getAttribute("href") || "";
      var href = decodeExponeaLink(rawHref); 
      var text = (a.textContent || "").replace(/\s+/g," ").trim();
      links.push({ text:text, href:href, flags:getLinkFlags(href) });
    }

    var hTags = doc.querySelectorAll("h1, h2, h3");
    var headlines = [];
    for(var h=0; h<hTags.length; h++) {
        var tag = hTags[h];
        var hlText = tag.textContent.replace(/\s+/g, ' ').trim();
        
        if(!hlText || hlText === "") continue;
        if(shouldIgnoreHeadline(hlText)) continue;
        
        var aTag = tag.querySelector("a") || tag.closest("a");
        var isLinked = aTag !== null;
        
        var rawHlHref = isLinked ? (aTag.getAttribute("href") || "") : "";
        var hlHref = decodeExponeaLink(rawHlHref);

        headlines.push({text: hlText, linked: isLinked, href: hlHref});
    }

    var imgEls = doc.querySelectorAll("img");
    var imagesAll = [];
    for (var k=0; k<imgEls.length; k++){
      var img = imgEls[k];
      var src = img.getAttribute("src") || "";
      var alt = img.getAttribute("alt");
      if (alt == null) alt = "";
      
      var linkNode = img.closest ? img.closest("a") : null;
      var rawHref2 = "";
      if (linkNode) { rawHref2 = linkNode.href || linkNode.getAttribute("href") || ""; }
      
      var href2 = decodeExponeaLink(rawHref2);
      
      imagesAll.push({ src:src, alt:alt, href:href2 });
    }

    var skuLinksData = [];
    imagesAll.forEach(function(im) {
      if (im.src.toLowerCase().indexOf("sku") !== -1) {
        var exists = skuLinksData.some(function(item) { return item.url === im.src; });
        if (!exists) {
          skuLinksData.push({ url: im.src, filename: getFilename(im.src) });
        }
      }
    });

    var images = imagesAll
      .filter(function(im){
        var fName = getFilename(im.src).toLowerCase();
        var cleanUrl = im.src.split('?')[0];
        return !IGNORED_IMAGE_URLS[cleanUrl] && !IGNORED_FILENAMES[fName];
      })
      .map(function(im){
        var flags = getImgFlags(im.alt).concat(getLinkFlags(im.href));
        return { src:im.src, alt:im.alt, href:im.href, flags:flags };
      });

    lastResults = { links: links, images: images, headlines: headlines, skuLinksData: skuLinksData };

    renderSkuLinks(skuLinksData);
    renderHeadlines(headlines);
    renderImagesTable(images);
    
    var summary = ["REVISION SUMMARY", "----------------"];
    var unlinked = headlines.filter(function(h) { return !h.linked; });
    if(unlinked.length > 0) {
      summary.push("HEADLINE ISSUES:");
      unlinked.forEach(function(h) { summary.push("- Unlinked: " + h.text); });
      summary.push("");
    }
    
    summary.push("IMAGE ISSUES:");
    images.forEach(function(im, idx) { 
      if(im.flags.length > 0) {
        var flagsText = im.flags.map(function(f) { return f.text; }).join(", ");
        summary.push("- Image " + (idx + 1) + ": " + flagsText); 
      }
    });
    
    revSummary.value = summary.join("\n");
    if (typeof pako !== 'undefined') {
        elStatus.textContent = "QA Complete. (" + new Date().toLocaleTimeString() + ")";
    }
  }

  // ===== EVENT LISTENERS =====
  btnRun.addEventListener("click", runQA);
  
  btnPasteRun.addEventListener("click", function() { 
    navigator.clipboard.readText().then(function(t) { 
      elHtml.value = t; 
      runQA(); 
    }).catch(function(){
      elStatus.textContent = "Clipboard blocked. Paste manually, then click Run QA.";
    }); 
  });
  
  btnScreenshot.addEventListener("click", takeScreenshot);
  
  btnClear.addEventListener("click", function() { location.reload(); });
  
  btnCopySummary.addEventListener("click", function() { 
    navigator.clipboard.writeText(revSummary.value); 
    copyStatus.textContent = "Copied!"; 
  });
  
  btnCopySkuLinks.addEventListener("click", function(e) { 
    navigator.clipboard.writeText(lastResults.skuLinksData.map(function(d){ return d.url; }).join(";")); 
    var originalText = e.target.textContent;
    e.target.textContent = "Copied!";
    e.target.style.backgroundColor = "#137333";
    e.target.style.color = "#ffffff";
    setTimeout(function(){ 
      e.target.textContent = originalText; 
      e.target.style.backgroundColor = "";
      e.target.style.color = "";
    }, 1500);
  });
  
  rowNumbersToggle.addEventListener("change", applyRowNumbers);
  previewDarkToggle.addEventListener("change", applyPreviewTheme);
  
  imagesOffToggle.addEventListener("change", function() {
    setEmailPreview(elHtml.value);
  });
  
  fullUrlToggle.addEventListener("change", function(){
    if (lastResults.images.length){
      renderImagesTable(lastResults.images);
    }
    if (lastResults.headlines.length) {
      renderHeadlines(lastResults.headlines);
    }
  });

  elImagesBody.addEventListener("click", function(e) { 
    if(e.target.classList.contains("copy-alt-btn")){ 
      var textContainer = e.target.parentElement.querySelector('.corrected-text');
      var txt = textContainer ? textContainer.innerText.trim() : ""; 
      navigator.clipboard.writeText(txt); 
      e.target.innerText = "Copied!"; 
      e.target.style.backgroundColor = "#137333";
      e.target.style.color = "#ffffff";
      setTimeout(function() { 
        e.target.innerText = "Copy Fix"; 
        e.target.style.backgroundColor = "";
        e.target.style.color = "";
      }, 1500); 
    } 
  });
})();