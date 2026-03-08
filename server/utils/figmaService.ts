const sanitizeTurkish = (text: string) => {
  if (!text) return "";
  return text
    .replace(/ş/g, '&#351;').replace(/Ş/g, '&#350;')
    .replace(/ı/g, '&#x131;').replace(/İ/g, '&#304;')
    .replace(/i/g, '&#105;').replace(/ğ/g, '&#287;')
    .replace(/Ğ/g, '&#286;').replace(/ü/g, '&#xFC;')
    .replace(/Ü/g, '&#xDC;').replace(/ö/g, '&#246;')
    .replace(/Ö/g, '&#xD6;').replace(/ç/g, '&#231;')
    .replace(/Ç/g, '&#xC7;')
    .replace(/\n/g, "<br/>");
};

function rgba(c: any) {
  if (!c || c.a === 0) return "transparent";
  const { r, g, b, a } = c;
  if (a === undefined || a >= 0.99) {
    return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
  }
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a.toFixed(2)})`;
}

function mapAlign(align: string) {
  switch (align) {
    case 'MIN': return 'start';
    case 'MAX': return 'end';
    case 'CENTER': return 'center';
    case 'SPACE_BETWEEN': return 'space-between';
    default: return 'start';
  }
}

function isImageNode(node: any) {
  const box = node.absoluteBoundingBox;
  if (box && box.width <= 48 && box.height <= 48) return true;
  if (node.fills?.some((f: any) => f.type === "IMAGE")) return true;
  
  const name = node.name.toLowerCase();
  if (name.includes("vector") || name.includes("icon") || name.includes("logo") || name.includes("svg")) return true;
  
  const isShape = node.type === "VECTOR" || node.type === "STAR" || node.type === "ELLIPSE" || node.type === "POLYGON";
  if (isShape && box.width < 100 && box.height < 100) return true;
  
  return false;
}

function findNodeById(node: any, id: string): any {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
}

function traverse(node: any, isParentAutoLayout: boolean, offsetX: number, offsetY: number, zIndex: number): string {
  if (node.visible === false || !node.absoluteBoundingBox) return "";
  
  const styles: any = {};
  let tag = 'div';
  let content = '';
  let attributes = '';
  const lowerName = node.name.toLowerCase();

  if (!lowerName.startsWith("frame ") && !lowerName.startsWith("group ") && !lowerName.startsWith("rectangle ") && !lowerName.startsWith("vector ") && !lowerName.startsWith("ellipse ")) {
    const cleanName = node.name.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 20);
    if (cleanName.length > 2) attributes += ` dn="${cleanName}"`;
  }

  const isImageOrIcon = isImageNode(node);
  if (isImageOrIcon) {
    attributes += ' ph="1"';
    if (node.type === "ELLIPSE") styles['rad'] = '50%';
    else if (node.cornerRadius) styles['rad'] = `${node.cornerRadius}px`;
  }

  let hasChildren = node.children && node.children.length > 0;
  //if (isImageOrIcon) hasChildren = false;

  const box = node.absoluteBoundingBox;
  const isAutoLayout = node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL';

  if (!isParentAutoLayout) styles['z'] = zIndex;

  if (isParentAutoLayout) {
    if (node.layoutGrow === 1) {
      styles['fg'] = 1;
      if (node.layoutMode === 'HORIZONTAL') styles['w'] = '0px';
    }
    if (node.layoutAlign === 'STRETCH') styles['as'] = 'stretch';
    if (node.layoutGrow !== 1) {
      const w = Math.round(box.width);
      styles['w'] = `${w}px`;
      styles['mw'] = '100%';
      styles['fs0'] = '1';
    }
    if (node.type !== 'TEXT') styles['h'] = `${Math.round(box.height)}px`;
  } else {
    styles['pos'] = 'abs';
    styles['l'] = `${Math.round(box.x - offsetX)}px`;
    styles['t'] = `${Math.round(box.y - offsetY)}px`;
    styles['w'] = `${Math.round(box.width)}px`;
    if (node.type !== 'TEXT') styles['h'] = `${Math.round(box.height)}px`;
  }

  if (isAutoLayout && !isImageOrIcon) {
    styles['d'] = 'flex';
    styles['fd'] = node.layoutMode === 'HORIZONTAL' ? 'row' : 'col';
    if (node.itemSpacing) styles['g'] = `${node.itemSpacing}px`;
    
    const p = [node.paddingTop || 0, node.paddingRight || 0, node.paddingBottom || 0, node.paddingLeft || 0];
    if (p.some(val => val > 0)) styles['p'] = p.join('px ') + 'px';
    
    if (node.counterAxisAlignItems !== 'MIN') styles['ai'] = mapAlign(node.counterAxisAlignItems);
    if (node.primaryAxisAlignItems !== 'MIN') styles['jc'] = mapAlign(node.primaryAxisAlignItems);
    
    if (node.layoutMode === 'HORIZONTAL' && box.height < 50) {
      styles['fw'] = 'nowrap';
      styles['ovf-x'] = 'vis';
    } else if (node.layoutMode === 'HORIZONTAL') {
      styles['fw'] = 'wrap';
    }
  } else if (!isImageOrIcon && hasChildren) {
    styles['pos'] = styles['pos'] === 'abs' ? 'abs' : 'rel';
  }

  if (node.fills?.[0]?.type === 'SOLID' && node.type !== 'TEXT') {
    const color = rgba(node.fills[0].color);
    if (color !== 'transparent') styles['bg'] = color;
  }
  
  if (node.strokes?.[0]?.type === 'SOLID') {
    styles['brd'] = `${node.strokeWeight || 1}px solid ${rgba(node.strokes[0].color)}`;
  }

  if (node.cornerRadius && !isImageOrIcon) styles['rad'] = `${node.cornerRadius}px`;
  if (node.type === "ELLIPSE" && !isImageOrIcon) styles['rad'] = '50%';
  if (node.effects?.some((e: any) => e.type === "DROP_SHADOW" && e.visible !== false)) styles['shd'] = '1';

  if (node.type === 'TEXT') {
    tag = 'span';
    hasChildren = false;
    content = node.characters ? sanitizeTurkish(node.characters) : "";
    if (node.style) {
      styles['fs'] = `${node.style.fontSize}px`;
      styles['fw'] = node.style.fontWeight;
      if (node.fills?.[0]?.type === 'SOLID') styles['c'] = rgba(node.fills[0].color);
      if (content.length < 40) styles['ws'] = 'nowrap';
      if (node.style.textAlignHorizontal && node.style.textAlignHorizontal !== 'LEFT') styles['ta'] = node.style.textAlignHorizontal.toLowerCase();
    }
  }

  const styleString = Object.entries(styles).map(([key, value]) => `${key}:${value}`).join(';');
  let html = `<${tag}${attributes} s="${styleString}">`;

  if (hasChildren) {
    const nextOffsetX = isAutoLayout ? 0 : box.x;
    const nextOffsetY = isAutoLayout ? 0 : box.y;
    let childIndex = zIndex + 1;
    node.children.forEach((child: any) => {
      html += traverse(child, isAutoLayout, nextOffsetX, nextOffsetY, childIndex++);
    });
  } else {
    html += content;
  }
  
  html += `</${tag}>`;
  return html;
}

export const fetchFigmaData = async (fileKey: string, nodeId?: string) => {
  const apiKey = process.env.FIGMA_API_KEY || process.env.FIGMA_ACCESS_TOKEN;
  const key = fileKey || process.env.FIGMA_FILE_KEY;

  if (!apiKey) throw new Error("FIGMA_API_KEY bulunamadı!");
  if (!key) throw new Error("Figma File Key bulunamadı!");

  const res = await fetch(`https://api.figma.com/v1/files/${key}`, {
    headers: { "X-Figma-Token": apiKey },
  });

  if (!res.ok) throw new Error(`Figma API Hatası: ${res.status}`);

  const data = await res.json();
  const document = data.document;

  let startNode = null;
  if (nodeId && nodeId.trim() !== "") {
    const formattedNodeId = nodeId.replace(/-/g, ':');
    startNode = findNodeById(document, formattedNodeId);
    if (!startNode) throw new Error(`Node ID (${formattedNodeId}) bulunamadı!`);
  } else {
    startNode = document.children?.[0]?.children?.[0];
    if (!startNode) throw new Error("Frame bulunamadı.");
  }

  let offsetX = 0;
  let offsetY = 0;
  let startNodeWidth = 1200;
  let startNodeHeight = 720;

  if (startNode.absoluteBoundingBox) {
    offsetX = startNode.absoluteBoundingBox.x;
    offsetY = startNode.absoluteBoundingBox.y;
    startNodeWidth = startNode.absoluteBoundingBox.width;
    startNodeHeight = startNode.absoluteBoundingBox.height;
  }

  let childrenHtml = traverse(startNode, false, offsetX, offsetY, 1);
  const pageBackground = startNode.backgroundColor ? rgba(startNode.backgroundColor) : "#f8fafc";
  const rootStyle = `pos:rel;ovf-x:hid;bg:${pageBackground};w:100%;max-w:${startNodeWidth}px;min-h:${startNodeHeight}px;d:flex;fd:col;font:Inter;margin:0 auto;`;
  const finalHtml = `<div id="root" s="${rootStyle}">\n${childrenHtml}\n</div>`;

  return { html: finalHtml, css: null, width: startNodeWidth, height: startNodeHeight };
};