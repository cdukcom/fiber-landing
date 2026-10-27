from pathlib import Path
import argparse, math
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF

DEFAULT_ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--root',type=Path,default=DEFAULT_ROOT)
parser.add_argument('--out',type=Path)
args=parser.parse_args()
ROOT=args.root; OUT=args.out or ROOT/'docs/fichas-tecnicas/cable-fibra';OUT.mkdir(parents=True,exist_ok=True)
for name,file in [('Body','Arial.ttf'),('Bold','Arial Bold.ttf'),('Brand','Arial Bold Italic.ttf')]:
 pdfmetrics.registerFont(TTFont(name,'/System/Library/Fonts/Supplemental/'+file))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Body',boldItalic='Bold')
RED=colors.HexColor('#ce0c17'); DARK=colors.HexColor('#151b24'); INK=colors.HexColor('#26313c'); GRAY=colors.HexColor('#586575'); LINE=colors.HexColor('#dce1e6'); SOFT=colors.HexColor('#f3f5f7'); WHITE=colors.white
body=ParagraphStyle('body',fontName='Body',fontSize=9,leading=12,textColor=INK)
small=ParagraphStyle('small',parent=body,fontSize=7.6,leading=10)
cell=ParagraphStyle('cell',parent=body,fontSize=7.7,leading=10)
boldcell=ParagraphStyle('boldcell',parent=cell,fontName='Bold')
COLORS=['#1760b2','#ed7b19','#158d4b','#79503e','#8e979f','#ffffff','#dc1b27','#1b2026','#f2cf19','#86429c','#ed8ab7','#69cec6']
NAMES=['Azul','Naranja','Verde','Marrón','Gris','Blanco','Rojo','Negro','Amarillo','Violeta','Rosa','Aguamarina']
PRODUCTS=[
 dict(key='sm',filename='cable-armado-monomodo-os2-12-hilos.pdf',headline='ARMADA',subhead='MONOMODO OS2',tag='GYXTW 12C SM G652D',title='Cable armado monomodo OS2 de 12 hilos',route='/cables-fibra/monomodo-armada-os2-12-hilos/',lead='Conecta tu infraestructura con fibra monomodo y protección de acero para redes exteriores.',apps=['Ductos y entierro directo','Redes troncales','Infraestructura de campus','Redes industriales']),
 dict(key='mm',filename='cable-armado-multimodo-om3-om4-6-12-hilos.pdf',headline='ARMADA',subhead='MULTIMODO OM3 / OM4',tag='6 O 12 HILOS  /  GYXTW',title='Cable armado multimodo OM3 / OM4 de 6 o 12 hilos',route='/cables-fibra/multimodo-armada-om3-12-hilos/',lead='Conecta edificios y redes de campus con fibra multimodo y protección mecánica para exteriores.',apps=['Ductos y entierro directo','Enlaces entre edificios','Redes de campus','Redes industriales']),
 dict(key='jet',filename='cable-indoor-outdoor-multimodo-om3-om4-6-12-hilos.pdf',headline='INTERIOR / EXTERIOR',subhead='MULTIMODO OM3 / OM4',tag='6 O 12 HILOS  /  JET',title='Cable interior / exterior multimodo OM3 / OM4 de 6 o 12 hilos',route='/cables-fibra/multimodo-indoor-outdoor-om3-12-hilos/',lead='Integra tu red con fibra multimodo, diseño compacto y refuerzo no metálico de hilos de vidrio.',apps=['Redes empresariales','Centros de datos','Redes de campus','Canalizaciones y edificios'])
]

def text(c,s,x,y,size=9,font='Body',color=INK):
 c.setFillColor(color);c.setFont(font,size);c.drawString(x,y,s)

def para(c,s,x,top,w,style=body):
 p=Paragraph(s,style);_,h=p.wrap(w,500);p.drawOn(c,x,top-h);return top-h

def fit(c,p,x,y,w,h):
 im=ImageReader(str(p));iw,ih=im.getSize();k=min(w/iw,h/ih)
 c.drawImage(im,x+(w-iw*k)/2,y+(h-ih*k)/2,width=iw*k,height=ih*k,mask='auto')

def path(c,pts,fill):
 c.setFillColor(fill);p=c.beginPath();p.moveTo(*pts[0])
 for xy in pts[1:]:p.lineTo(*xy)
 p.close();c.drawPath(p,stroke=0,fill=1)

def icon(c,kind,x,y):
 c.saveState();c.setStrokeColor(RED);c.setLineWidth(1.3)
 if kind=='shield':
  p=c.beginPath();p.moveTo(x-8,y+9);p.lineTo(x,y+12);p.lineTo(x+8,y+9);p.lineTo(x+7,y-2);p.curveTo(x+5,y-7,x+2,y-10,x,y-11);p.curveTo(x-2,y-10,x-5,y-7,x-7,y-2);p.close();c.drawPath(p,fill=0,stroke=1)
 elif kind=='drop':
  p=c.beginPath();p.moveTo(x,y+12);p.curveTo(x-2,y+7,x-9,y,x-7,y-6);p.curveTo(x-4,y-13,x+4,y-13,x+7,y-6);p.curveTo(x+9,y,x+2,y+7,x,y+12);c.drawPath(p,fill=0,stroke=1)
 elif kind=='wires':
  c.line(x-5,y-10,x-5,y+10);c.line(x+5,y-10,x+5,y+10)
  for yy in [-10,10]:c.line(x-8,y+yy,x-2,y+yy);c.line(x+2,y+yy,x+8,y+yy)
 elif kind=='fiber':
  for i in [-1,0,1]:
   c.line(x-5,y-10,x+5*i,y+8);c.circle(x+5*i,y+8,2,stroke=1,fill=0)
 elif kind=='compact':
  c.circle(x,y,8,fill=0,stroke=1);c.line(x-12,y-12,x+12,y-12);c.line(x-12,y-15,x-12,y-9);c.line(x+12,y-15,x+12,y-9)
 c.restoreState()

def benefits(c,jet):
 features=([('fiber','NO METÁLICO','Refuerzo de hilos de vidrio'),('drop','TUBO CON GEL','Protección de las fibras'),('compact','DISEÑO COMPACTO','Diámetro de 6,0 ± 0,2 mm')] if jet else [('shield','ARMADURA DE ACERO','Protección mecánica y contra roedores'),('drop','BLOQUEO DE AGUA','Tubo con gel y cinta bloqueadora'),('wires','DOBLE REFUERZO','Dos alambres de acero paralelos')])
 c.setFillColor(SOFT);c.roundRect(32,529,531,51,5,fill=1,stroke=0)
 for i,(kind,heading,desc) in enumerate(features):
  x=32+i*177
  if i:c.setStrokeColor(LINE);c.line(x,538,x,571)
  icon(c,kind,x+20,555)
  text(c,heading,x+39,560,7.7,'Bold')
  para(c,desc,x+39,553,130,small)

def cross_section(c,jet):
 x,y=97,443
 def circle(r,color):c.setFillColor(colors.HexColor(color));c.circle(x,y,r,fill=1,stroke=0)
 circle(49,'#22262b')
 if jet:
  circle(37,'#e1dac4');c.setStrokeColor(colors.HexColor('#b7b49f'));c.setLineWidth(.5)
  for i in range(72):
   a=math.radians(i*5);c.line(x+math.cos(a)*32,y+math.sin(a)*32,x+math.cos(a)*36,y+math.sin(a)*36)
  circle(29,'#d2d9df');circle(25,'#fafafa');circle(20,'#cee7ed')
 else:
  circle(34,'#aebbc5');c.setStrokeColor(colors.HexColor('#728793'));c.setLineWidth(.6)
  for i in range(60):
   a=math.radians(i*6);c.line(x+math.cos(a)*31,y+math.sin(a)*31,x+math.cos(a)*34,y+math.sin(a)*34)
  circle(30,'#79b48e');circle(26,'#d2d9df');circle(23,'#fafafa');circle(19,'#cee7ed')
  for dx in [-41,41]:
   c.setFillColor(colors.HexColor('#d5dbe0'));c.circle(x+dx,y,4,fill=1,stroke=0)
 coords=[(-9,9),(0,10),(9,8),(-12,0),(-4,1),(5,1),(13,0),(-9,-9),(0,-9),(9,-8),(-3,-17),(4,17)]
 for (dx,dy),co in zip(coords,COLORS):
  c.setFillColor(colors.HexColor(co));c.setStrokeColor(colors.HexColor('#73818b'));c.setLineWidth(.4);c.circle(x+dx,y+dy,2.5,stroke=1,fill=1)
 legend=([('Cubierta exterior','#22262b'),('Hilos de vidrio','#e1dac4'),('Tubo holgado de PBT','#d2d9df'),('Gel de relleno','#cee7ed'),('Fibras ópticas de colores','#1760b2')] if jet else [('Cubierta exterior de PE','#22262b'),('Cinta de acero corrugado','#aebbc5'),('Cinta bloqueadora de agua','#79b48e'),('Tubo holgado de PBT','#d2d9df'),('Gel de relleno','#cee7ed'),('Fibras ópticas de colores','#1760b2'),('Dos alambres de acero','#d5dbe0')])
 for i,(s,co) in enumerate(legend):
  yy=489-i*15
  c.setFillColor(colors.HexColor(co));c.setStrokeColor(LINE);c.rect(165,yy-2,7,7,fill=1,stroke=1);text(c,s,179,yy-1,7.5)
 text(c,'CORTE TRANSVERSAL',48,381,6.6,'Bold',GRAY)

def construction(c,p,jet):
 text(c,'CONSTRUCCIÓN DEL CABLE',32,510,9,'Bold',RED)
 cross_section(c,jet)
 c.setStrokeColor(LINE);c.line(379,377,379,516)
 text(c,'APLICACIONES',397,510,9,'Bold',RED)
 for i,s in enumerate(p['apps']):
  yy=483-i*29
  c.setFillColor(RED);c.circle(401,yy+2,2.4,fill=1,stroke=0)
  para(c,s,412,yy+8,150,ParagraphStyle('app',parent=body,fontSize=8.3,leading=11))

def colorstrip(c):
 text(c,'IDENTIFICACIÓN DE FIBRAS POR COLOR',32,363,7.2,'Bold',GRAY)
 w=531/12
 for i,(name,co) in enumerate(zip(NAMES,COLORS)):
  x=32+i*w;c.setFillColor(colors.HexColor(co));c.setStrokeColor(LINE);c.setLineWidth(.3);c.rect(x,331,w,24,fill=1,stroke=1)
  ink=INK if i in [5,8,10,11] else WHITE
  c.setFillColor(ink);c.setFont('Bold',6.8);c.drawCentredString(x+w/2,346,str(i+1));c.setFont('Body',6.1);c.drawCentredString(x+w/2,336,name)

def head(c,s,x,y,w):
 c.setFillColor(DARK);c.rect(x,y-23,w,23,fill=1,stroke=0);text(c,s,x+9,y-15,8.2,'Bold',WHITE)

def draw_table(c,rows,x,y,widths,heights=None,header=False):
 data=[[Paragraph(str(v),boldcell if header and i==0 else cell) for v in r] for i,r in enumerate(rows)]
 t=Table(data,colWidths=widths,rowHeights=heights)
 cmds=[('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('ROWBACKGROUNDS',(0,0),(-1,-1),[SOFT,WHITE]),('LINEBELOW',(0,0),(-1,-1),.3,LINE)]
 if header:cmds += [('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e4e9ed'))]
 t.setStyle(TableStyle(cmds));_,h=t.wrap(sum(widths),500);t.drawOn(c,x,y-h);return y-h

def specs(c,jet,sm):
 head(c,'DATOS ÓPTICOS Y DIMENSIONES',32,318,259)
 left=[('Tipo de fibra','SM G652D · OS2' if sm else 'OM3 / OM4 · 50/125 µm'),('Número de fibras','12' if sm else '6 o 12'),('Longitudes de onda','1310 / 1550 nm' if sm else '850 / 1300 nm'),('Atenuación OM3 (850 / 1300 nm)' if jet else 'Atenuación (ondas indicadas)','0,36 / 0,24 dB/km' if sm else '3,5 / 1,5 dB/km'),('Diámetro exterior','6,0 ± 0,2 mm' if jet else '8,3 ± 0,5 mm'),('Diámetro del tubo PBT','2,5 ± 0,1 mm'),('Refuerzo' if jet else 'Diámetro de alambres de acero','Hilos de vidrio' if jet else '0,7 ± 0,05 mm')]
 if not jet:left.append(('Cubierta exterior','PE negro'))
 bottom=draw_table(c,left,32,295,[146,113],heights=[21]*len(left))
 head(c,'PRESTACIONES DEL CABLE',304,318,259)
 rows=[('Parámetro','Largo plazo','Corto plazo'),('Tracción máxima (N)','250' if jet else '300','800' if jet else '1.000'),('Aplastamiento (N/100 mm)','300','1.000')]
 y=draw_table(c,rows,304,295,[143,58,58],heights=[24,24,24],header=True)
 rest=[('Curvatura dinámica / estática','20D / 10D'),('D','Diámetro exterior del cable'),('Operación y almacenamiento','-20 °C a +70 °C'),('Longitud de carrete','2.000 m')]
 y=draw_table(c,rest,304,y,[143,116],heights=[24,24,24,24])
 assert min(bottom,y)>=120

def cta(c,p):
 c.setStrokeColor(RED);c.setLineWidth(1.6);c.line(32,112,563,112)
 text(c,'COTIZA EL CABLE PARA TU PROYECTO',32,91,11,'Bold',RED)
 text(c,'Venta por metros · Asesoría para elegir fibra, hilos y metraje',32,75,8.3)
 text(c,'Suministro en carretes de madera con informe de inspección del cable.',32,59,7.4,'Body',GRAY)
 url='https://www.speednetfo.com/'
 widget=qr.QrCodeWidget(url);bx,by,bw,bh=widget.getBounds();side=49
 d=Drawing(side,side,transform=[side/(bw-bx),0,0,side/(bh-by),0,0]);d.add(widget);renderPDF.draw(d,c,514,55)
 c.linkURL(url,(511,52,563,105),relative=0)
 text(c,'VISITA SPEEDNET',514,46,6.2,'Bold',GRAY)

def build(p):
 jet=p['key']=='jet';sm=p['key']=='sm';c=canvas.Canvas(str(OUT/p['filename']),pagesize=A4,pageCompression=1)
 c.setTitle((p['tag']+' · ' if sm else '')+p['title']);c.setAuthor('Speednet');c.setSubject('Ficha comercial y técnica en español')
 c.setFillColor(WHITE);c.rect(0,0,*A4,fill=1,stroke=0)
 text(c,'SPEEDNET',32,807,27,'Brand',RED)
 text(c,'CONECTIVIDAD ÓPTICA',34,795,6.9,'Bold',GRAY)
 path(c,[(346,842),(595.3,842),(595.3,788),(325,788)],DARK)
 path(c,[(328,842),(346,842),(325,788),(307,788)],RED)
 text(c,'SPEEDNET',375,818,8,'Bold',WHITE)
 text(c,'www.speednetfo.com',375,802,9,'Body',WHITE)
 text(c,'CABLE DE FIBRA ÓPTICA',32,768,7.8,'Bold',GRAY)
 text(c,p['headline'],32,738,22.5 if jet else 31,'Bold',RED)
 text(c,p['subhead'],32,714,18.2 if not sm else 20,'Bold',DARK)
 if sm:
  text(c,p['tag'],33,693,10.5,'Bold',DARK)
  lead_top=674
 else:
  model='JET' if jet else 'GYXTW'
  text(c,f'{model} 6C MM OM3  ·  {model} 12C MM OM3',33,693,8.4,'Bold',DARK)
  text(c,f'{model} 6C MM OM4  ·  {model} 12C MM OM4',33,680,8.4,'Bold',DARK)
  lead_top=666
 para(c,p['lead'],33,lead_top,231,body)
 # Product cutaway from the existing, approved product asset.
 path(c,[(288,600),(563,600),(563,778),(400,778)],SOFT)
 fit(c,ROOT/'img/cable-types'/('indoor-outdoor.webp' if jet else 'armada.webp'),269,590,309,211)
 c.setFillColor(RED);c.roundRect(32,598,142,23,3,fill=1,stroke=0);text(c,'DISPONIBLE POR METROS',42,606,7.7,'Bold',WHITE)
 benefits(c,jet);construction(c,p,jet);colorstrip(c);specs(c,jet,sm);cta(c,p)
 c.setFillColor(DARK);c.rect(0,0,595.3,35,fill=1,stroke=0)
 text(c,'SPEEDNET',32,21,8,'Bold',WHITE)
 text(c,'sales@speednetfo.com',32,9,7.3,'Body',WHITE)
 text(c,'www.speednetfo.com',451,16,8.2,'Bold',WHITE)
 c.linkURL('mailto:sales@speednetfo.com',(32,55,486,104),relative=0)
 c.save();print(OUT/p['filename'])
for product in PRODUCTS:build(product)
