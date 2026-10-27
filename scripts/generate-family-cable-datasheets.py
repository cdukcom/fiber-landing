from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph,Table,TableStyle
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT / 'docs/fichas-tecnicas/cable-fibra'
OUT.mkdir(parents=True,exist_ok=True)
red=colors.HexColor('#ce151c'); dark=colors.HexColor('#182333'); gray=colors.HexColor('#536174')
style=ParagraphStyle('body',fontName='Helvetica',fontSize=9.2,leading=12.5,textColor=dark)
small=ParagraphStyle('small',parent=style,fontSize=8.8,leading=11.8)

def para(c,text,x,y,w,s=style):
 p=Paragraph(text,s); _,h=p.wrap(w,1000);p.drawOn(c,x,y-h);return y-h

def table(c,rows,y):
 data=[[Paragraph(a,small),Paragraph(b,small)] for a,b in rows]
 t=Table(data,colWidths=[226,297]);t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('ROWBACKGROUNDS',(0,0),(-1,-1),[colors.HexColor('#f0f3f6'),colors.white]),('LINEBELOW',(0,0),(-1,-1),.3,colors.HexColor('#d7dfe5'))]));_,h=t.wrap(523,1000);t.drawOn(c,36,y-h);return y-h

def section(c,title,y):
 c.setFillColor(dark);c.rect(36,y-21,523,21,fill=1,stroke=0);c.setFillColor(colors.white);c.setFont('Helvetica-Bold',9);c.drawString(44,y-14,title);return y-21

for key,title,name in [('sm','ARMADA MONOMODO OS2','cable-armado-monomodo-os2-12-hilos.pdf'),('mm','ARMADA MULTIMODO OM3 / OM4','cable-armado-multimodo-om3-om4-6-12-hilos.pdf'),('jet','INTERIOR / EXTERIOR OM3 / OM4','cable-indoor-outdoor-multimodo-om3-om4-6-12-hilos.pdf')]:
 jet=key=='jet'; sm=key=='sm'; path=OUT/name
 c=canvas.Canvas(str(path),pagesize=A4);c.setTitle(title);c.setAuthor('Fiber Electronics S.A.S. / Speednet')
 c.setFillColor(red);c.rect(0,783,595.3,59,fill=1,stroke=0);c.setFillColor(colors.white);c.setFont('Helvetica-BoldOblique',25);c.drawString(36,804,'SPEEDNET');c.setFont('Helvetica',9);c.drawRightString(559,811,'FICHA TÉCNICA');c.drawRightString(559,797,'www.fibersas.com')
 c.setFillColor(dark);c.setFont('Helvetica-Bold',19);c.drawString(36,753,title)
 c.setFont('Helvetica',10);c.setFillColor(gray);c.drawString(36,734,('12 hilos' if sm else '6 o 12 hilos')+'  |  '+('JET · No metálico' if jet else 'GYXTW · Armadura de acero corrugado'))
 y=para(c,'Cable de fibra óptica '+('multimodo con tubo holgado central, gel y refuerzo de hilos de vidrio. Familia comercial para uso interior / exterior.' if jet else ('monomodo' if sm else 'multimodo')+' para exteriores, con tubo holgado central, gel, cinta bloqueadora de agua y armadura metálica.'),36,717,523)-12
 y=section(c,'CONSTRUCCIÓN Y PARÁMETROS ÓPTICOS',y)
 rows=[('Tipo de fibra / presentación',('OS2 monomodo · 12 fibras' if sm else 'Multimodo · 6 o 12 fibras')),('Variante documentada por fabricante',('G652D (G.652.D)' if sm else 'OM3-300' if jet else 'OM3-300 / OM4')),('Longitudes de onda', '1310 / 1550 nm' if sm else '850 / 1300 nm'),('Atenuación a las longitudes indicadas', '0,36 / 0,24 dB/km' if sm else '3,5 / 1,5 dB/km'),('Tubo holgado PBT con gel · diámetro','2,5 ± 0,1 mm')]
 if jet: rows += [('Refuerzo','Hilos de vidrio; construcción no metálica')]
 else: rows += [('Protección','Cinta bloqueadora de agua y cinta de acero corrugado'),('Alambres de acero · diámetro','0,7 ± 0,05 mm')]
 rows += [('Diámetro exterior del cable','6,0 ± 0,2 mm' if jet else '8,3 ± 0,5 mm'),('Cubierta exterior','Material y color no especificados en la ficha recibida')]
 y=table(c,rows,y)-12
 y=section(c,'PRESTACIONES MECÁNICAS Y AMBIENTALES',y)
 y=table(c,[('Parámetro','Largo plazo / Corto plazo'),('Tracción máxima', '250 N / 800 N' if jet else '300 N / 1.000 N'),('Resistencia máxima al aplastamiento','300 / 1.000 N por 100 mm'),('Radio mínimo de curvatura','20D dinámico / 10D estático; D = diámetro del cable'),('Operación y almacenamiento','-20 °C a +70 °C')],y)-12
 y=section(c,'SUMINISTRO Y CONTROL DE CALIDAD',y)
 y=para(c,'Superficie sin daños ni porosidades. Embalaje en carrete de madera con protección de madera. Longitud de cada tramo: al menos 1.000 m; otras longitudes por acuerdo. Los tramos de un mismo lote deben tener longitudes similares en lo posible. El informe de inspección incluye número de inspección, tipo de cable, cantidad y tipo de fibras, longitud y otros datos.',44,y-8,507,small)-12
 y=section(c,'ALCANCE DE LA INFORMACIÓN',y)
 note=('Se conserva la agrupación comercial OM3 / OM4. La ficha JET recibida documenta OM3-300 y no incluye OM4; las prestaciones de la variante OM4 requieren confirmación del fabricante. ' if jet else '')
 note+='La ficha recibida no declara '+('LSZH, ' if jet else 'PVC, ')+'peso, certificaciones ni ensayos de reacción al fuego. No se atribuyen esas características al producto. Confirmar la variante y el metraje al cotizar.'
 y=para(c,note,44,y-8,507,small)-9
 y=para(c,'Fuente: '+('JET-12C specs.pdf · JET 6-12 fibras.' if jet else 'Unknown.pdf · GYXTW 6-12 fibras.')+' Adaptación al español: 27/10/2026.',44,y,507,small)
 assert y>55,(name,y)
 c.setFillColor(dark);c.rect(0,0,595.3,39,fill=1,stroke=0);c.setFillColor(colors.white);c.setFont('Helvetica-Bold',8);c.drawString(36,24,'FIBER ELECTRONICS S.A.S.');c.setFont('Helvetica',7.5);c.drawString(36,12,'ventas@fibersas.com  ·  +57 313 499 1444');c.drawRightString(559,18,'www.fibersas.com  |  1 / 1');c.save()
 assert len(PdfReader(path).pages)==1
 print(name,'content bottom',round(y))
