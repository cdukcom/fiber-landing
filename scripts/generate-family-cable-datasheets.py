from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "fichas-tecnicas" / "cable-fibra"
OUT.mkdir(parents=True, exist_ok=True)

RED = colors.HexColor("#d20a0a")
DARK = colors.HexColor("#111111")
INK = colors.HexColor("#171b26")
MUTED = colors.HexColor("#526072")
LINE = colors.HexColor("#d7dce3")
SOFT = colors.HexColor("#f4f6f8")
WHITE = colors.white

BODY = ParagraphStyle("body", fontName="Helvetica", fontSize=8.4, leading=11, textColor=INK)
SMALL = ParagraphStyle("small", fontName="Helvetica", fontSize=7.2, leading=9.2, textColor=MUTED)
FEATURE = ParagraphStyle("feature", fontName="Helvetica", fontSize=7.5, leading=9.5, textColor=INK)

PRODUCTS = [
    {
        "filename": "cable-armado-monomodo-os2-12-hilos.pdf",
        "eyebrow": "CABLE ÓPTICO ARMADO · EXTERIOR",
        "title": "Armada monomodo OS2",
        "subtitle": "12 hilos · GYXTW · Cubierta PVC",
        "image": ROOT / "img" / "cable-types" / "armada.webp",
        "badges": ["OS2 9/125 µm", "12 HILOS", "PVC", "VENTA POR METROS"],
        "description": "Cable monomodo armado para enlaces de larga distancia, ductos, canalizaciones y tendidos exteriores que requieren alta resistencia mecánica y protección contra roedores.",
        "fiber_rows": [("Tipo de fibra", "OS2 monomodo 9/125 µm"), ("Número de fibras", "12"), ("Estándar óptico", "ITU-T G.652.D")],
        "features": [
            ("Protección", "Armadura de cinta de acero corrugado para resistencia al impacto y aplastamiento."),
            ("Exterior", "Tubo holgado con gel y cinta bloqueadora de agua para ambientes exigentes."),
            ("Tracción", "Dos alambres de acero paralelos como miembros de fuerza longitudinal."),
        ],
        "specs": [
            ("Construcción", "Tubo holgado central GYXTW"), ("Cubierta exterior", "PVC negro"),
            ("Armadura", "Cinta de acero corrugado (CST)"), ("Bloqueo de agua", "Cinta hidroexpansible y tubo con gel"),
            ("Resistencia al aplastamiento", "1.000 N/100 mm"), ("Carga máxima de tracción", "1.500 N"),
            ("Diámetro exterior nominal", "8,3 ± 0,2 mm"), ("Peso nominal", "70 kg/km"),
            ("Radio mínimo de curvatura", "10D instalado / 20D bajo carga"), ("Temperatura de operación", "-20 °C a +60 °C"),
            ("Longitud estándar de carrete", "2 km; venta por metros según disponibilidad"),
        ],
        "standards": "IEC 60794 · ITU-T G.652.D · TIA/EIA-598 · RoHS · ISO 9001:2015",
    },
    {
        "filename": "cable-armado-multimodo-om3-om4-6-12-hilos.pdf",
        "eyebrow": "CABLE ÓPTICO ARMADO · EXTERIOR",
        "title": "Armada multimodo OM3 / OM4",
        "subtitle": "6 o 12 hilos · GYXTW · Cubierta PVC",
        "image": ROOT / "img" / "cable-types" / "armada.webp",
        "badges": ["OM3 / OM4", "6 / 12 HILOS", "PVC", "VENTA POR METROS"],
        "description": "Cable multimodo armado para backbone, redes de campus, ductos y tendidos exteriores donde se requiere protección contra roedores y alta resistencia mecánica.",
        "fiber_rows": [("Tipos de fibra", "OM3 u OM4 multimodo 50/125 µm"), ("Número de fibras", "6 o 12"), ("Estándares ópticos", "TIA-492AAAC (OM3) / TIA-492AAAD (OM4)")],
        "features": [
            ("Protección", "Armadura de cinta de acero corrugado para resistencia al impacto y aplastamiento."),
            ("Exterior", "Tubo holgado con gel y cinta bloqueadora de agua para ambientes exigentes."),
            ("Tracción", "Dos alambres de acero paralelos como miembros de fuerza longitudinal."),
        ],
        "specs": [
            ("Construcción", "Tubo holgado central GYXTW"), ("Cubierta exterior", "PVC negro"),
            ("Armadura", "Cinta de acero corrugado (CST)"), ("Bloqueo de agua", "Cinta hidroexpansible y tubo con gel"),
            ("Resistencia al aplastamiento", "1.000 N/100 mm"), ("Carga máxima de tracción", "1.500 N"),
            ("Diámetro exterior nominal", "8,3 ± 0,2 mm"), ("Peso nominal", "70 kg/km"),
            ("Radio mínimo de curvatura", "10D instalado / 20D bajo carga"), ("Temperatura de operación", "-20 °C a +60 °C"),
            ("Longitud estándar de carrete", "2 km; venta por metros según disponibilidad"),
        ],
        "standards": "IEC 60794 · IEC 60793-2-10 · TIA/EIA-598 · RoHS · ISO 9001:2015",
    },
    {
        "filename": "cable-indoor-outdoor-multimodo-om3-om4-6-12-hilos.pdf",
        "eyebrow": "CABLE ÓPTICO NO METÁLICO · INTERIOR / EXTERIOR",
        "title": "Indoor / outdoor OM3 / OM4",
        "subtitle": "6 o 12 hilos · Cubierta LSZH",
        "image": ROOT / "img" / "cable-types" / "indoor-outdoor.webp",
        "badges": ["OM3 / OM4", "6 / 12 HILOS", "LSZH", "VENTA POR METROS"],
        "description": "Cable multimodo no metálico para backbone, centros de datos, redes empresariales y enlaces interiores o exteriores que requieren baja emisión de humo y cero halógenos.",
        "fiber_rows": [("Tipos de fibra", "OM3 u OM4 multimodo 50/125 µm"), ("Número de fibras", "6 o 12"), ("Estándares ópticos", "TIA-492AAAC (OM3) / TIA-492AAAD (OM4)")],
        "features": [
            ("LSZH", "Cubierta de baja emisión de humo y cero halógenos para espacios interiores."),
            ("No metálico", "Miembros de fuerza de hilo de vidrio y construcción dieléctrica."),
            ("Versátil", "Apto para redes empresariales, campus, ductos y backbone de centros de datos."),
        ],
        "specs": [
            ("Construcción", "Tubo holgado central no metálico"), ("Cubierta exterior", "LSZH negro"),
            ("Miembro de fuerza", "Hilos de vidrio"), ("Bloqueo de agua", "Tubo holgado con gel"),
            ("Resistencia al aplastamiento", "1.000 N/100 mm"), ("Carga máxima de tracción", "800 N"),
            ("Diámetro exterior nominal", "6,0 ± 0,2 mm"), ("Peso nominal", "35 kg/km"),
            ("Radio mínimo de curvatura", "10D instalado / 20D bajo carga"), ("Temperatura de operación", "-20 °C a +60 °C"),
            ("Temperatura de almacenamiento", "-40 °C a +70 °C"), ("Longitud estándar de carrete", "2 km; venta por metros según disponibilidad"),
        ],
        "standards": "IEC 60794 · IEC 60793-2-10 · TIA/EIA-598 · RoHS · ISO 9001:2015",
    },
]


def paragraph(c, text, style, x, y, width, height=100):
    p = Paragraph(text, style)
    _, used = p.wrap(width, height)
    p.drawOn(c, x, y - used)
    return used


def fit_image(c, path, x, y, width, height):
    image = ImageReader(str(path))
    iw, ih = image.getSize()
    scale = min(width / iw, height / ih)
    w, h = iw * scale, ih * scale
    c.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h, mask="auto")


def pill(c, text, x, y, width):
    c.setFillColor(RED)
    c.roundRect(x, y, width, 22, 7, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 7.2)
    c.drawCentredString(x + width / 2, y + 7.5, text)


def section_title(c, text, y):
    c.setFillColor(DARK)
    c.rect(36, y - 3, 523, 23, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(46, y + 4, text.upper())


def build(product):
    path = OUT / product["filename"]
    c = canvas.Canvas(str(path), pagesize=A4)
    c.setTitle(product["title"])
    c.setAuthor("Fiber Electronics S.A.S. / Speednet")
    w, h = A4

    # Header inspired by the supplied Speednet examples.
    c.setFillColor(WHITE)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(RED)
    c.setFont("Helvetica-BoldOblique", 28)
    c.drawString(28, h - 43, "SPEEDNET")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.6)
    c.drawString(30, h - 54, "RELIABLE OPTICAL CONNECTIVITY")
    c.setFillColor(DARK)
    c.rect(345, h - 66, 250, 66, fill=1, stroke=0)
    c.setFillColor(RED)
    p = c.beginPath(); p.moveTo(305, h); p.lineTo(365, h); p.lineTo(335, h - 66); p.lineTo(275, h - 66); p.close()
    c.drawPath(p, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 8)
    c.drawRightString(w - 27, h - 28, "www.speednetfo.com")
    c.setFont("Helvetica", 7.5)
    c.drawRightString(w - 27, h - 44, "sales@speednetfo.com")

    # Hero area.
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 26)
    c.drawString(28, h - 105, product["title"].upper())
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(29, h - 126, product["subtitle"])
    c.setFillColor(RED)
    c.roundRect(28, h - 157, 125, 22, 2, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(90.5, h - 150, product["badges"][1])
    paragraph(c, product["description"], SMALL, 29, h - 166, 240, 52)
    fit_image(c, product["image"], 275, h - 206, 292, 132)

    # Three-column block matching the examples.
    panel_top = h - 220
    panel_bottom = h - 420
    left_x, left_w = 22, 142
    center_x, center_w = 172, 250
    right_x, right_w = 430, 143
    for x, pw in ((left_x, left_w), (center_x, center_w), (right_x, right_w)):
        c.setStrokeColor(LINE); c.setLineWidth(.6); c.rect(x, panel_bottom, pw, panel_top - panel_bottom, fill=0, stroke=1)
    c.setFillColor(DARK); c.rect(left_x, panel_top - 24, left_w, 24, fill=1, stroke=0)
    c.rect(right_x, panel_top - 24, right_w, 24, fill=1, stroke=0)
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 9)
    c.drawString(left_x + 10, panel_top - 16, "APLICACIONES")
    c.drawString(right_x + 10, panel_top - 16, "CARACTERÍSTICAS")
    c.setFillColor(RED); c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(center_x + center_w / 2, panel_top - 18, "CONSTRUCCIÓN DEL CABLE")

    armored = "Armada" in product["title"]
    applications = (["Ductos exteriores", "Entierro directo", "Redes troncales ISP", "Redes industriales", "Infraestructura de campus"] if armored else ["Redes empresariales", "Redes de campus", "Centros de datos", "Telecomunicaciones", "Instalaciones interiores y ductos"])
    for i, item in enumerate(applications):
        yy = panel_top - 47 - i * 29
        c.setFillColor(RED); c.circle(left_x + 14, yy + 3, 4, fill=1, stroke=0)
        c.setFillColor(INK); c.setFont("Helvetica", 7.4); c.drawString(left_x + 25, yy, item)
        c.setStrokeColor(LINE); c.line(left_x + 9, yy - 9, left_x + left_w - 9, yy - 9)

    fit_image(c, product["image"], center_x + 20, panel_bottom + 68, center_w - 40, 92)
    layers = (["Cubierta exterior de PVC", "Cinta de acero corrugado", "Cinta bloqueadora de agua", "Tubo holgado PBT con gel", "Fibras ópticas de 250 µm", "Dos alambres de acero"] if armored else ["Cubierta exterior LSZH", "Miembros de fuerza de hilo de vidrio", "Tubo holgado PBT con gel", "Fibras ópticas de 250 µm", "Construcción no metálica"])
    for i, item in enumerate(layers):
        x = center_x + 14 + (i % 2) * 118
        yy = panel_bottom + 55 - (i // 2) * 17
        c.setFillColor(RED); c.circle(x, yy + 2, 2.2, fill=1, stroke=0)
        c.setFillColor(INK); c.setFont("Helvetica", 6.6); c.drawString(x + 6, yy, item)

    for i, (heading, text) in enumerate(product["features"]):
        yy = panel_top - 47 - i * 51
        c.setFillColor(RED); c.circle(right_x + 14, yy + 5, 6.5, fill=1, stroke=0)
        c.setFillColor(INK); c.setFont("Helvetica-Bold", 7.4); c.drawString(right_x + 25, yy + 7, heading.upper())
        paragraph(c, text, SMALL, right_x + 25, yy + 3, right_w - 33, 31)

    # Fiber identification strip.
    strip_top = panel_bottom - 12
    c.setFillColor(DARK); c.rect(22, strip_top - 22, 551, 22, fill=1, stroke=0)
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 8.5)
    c.drawString(31, strip_top - 15, "IDENTIFICACIÓN DE FIBRAS (TIA/EIA-598)")
    fiber_colors = [
        ("1", "Azul", colors.HexColor("#1565c0"), WHITE), ("2", "Naranja", colors.HexColor("#ef6c00"), WHITE),
        ("3", "Verde", colors.HexColor("#138a3d"), WHITE), ("4", "Marrón", colors.HexColor("#6d2d13"), WHITE),
        ("5", "Gris", colors.HexColor("#9e9e9e"), WHITE), ("6", "Blanco", WHITE, INK),
        ("7", "Rojo", colors.red, WHITE), ("8", "Negro", DARK, WHITE), ("9", "Amarillo", colors.yellow, INK),
        ("10", "Violeta", colors.HexColor("#6a3d9a"), WHITE), ("11", "Rosa", colors.HexColor("#ed4d9a"), WHITE),
        ("12", "Aqua", colors.HexColor("#72d6d0"), INK),
    ]
    box_w = 551 / 12
    color_y = strip_top - 55
    for i, (num, name, fill, text_color) in enumerate(fiber_colors):
        x = 22 + i * box_w
        c.setFillColor(fill); c.rect(x, color_y, box_w, 33, fill=1, stroke=0)
        c.setFillColor(text_color); c.setFont("Helvetica-Bold", 6.4)
        c.drawCentredString(x + box_w / 2, color_y + 20, num)
        c.setFont("Helvetica", 5.8); c.drawCentredString(x + box_w / 2, color_y + 8, name)

    # Technical specification and compliance, like the source sheets.
    tech_top = color_y - 14
    left_table_w = 388
    c.setFillColor(RED); c.rect(22, tech_top - 22, 158, 22, fill=1, stroke=0)
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 8.5); c.drawString(31, tech_top - 15, "ESPECIFICACIÓN TÉCNICA")
    c.setFillColor(DARK); c.rect(22, tech_top - 40, left_table_w, 18, fill=1, stroke=0)
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 6.8)
    c.drawString(30, tech_top - 34, "PARÁMETRO"); c.drawString(258, tech_top - 34, "VALOR")
    specs = product["fiber_rows"] + product["specs"]
    max_rows = 15
    row_h = 12.2
    for i, (label, value) in enumerate(specs[:max_rows]):
        yy = tech_top - 40 - (i + 1) * row_h
        c.setFillColor(WHITE if i % 2 == 0 else SOFT); c.rect(22, yy, left_table_w, row_h, fill=1, stroke=0)
        c.setStrokeColor(LINE); c.rect(22, yy, left_table_w, row_h, fill=0, stroke=1); c.line(248, yy, 248, yy + row_h)
        c.setFillColor(INK); c.setFont("Helvetica", 5.9)
        c.drawString(29, yy + 3.7, label[:56]); c.drawString(255, yy + 3.7, value[:45])

    compliance_x = 420
    c.setFillColor(DARK); c.rect(compliance_x, tech_top - 40, 153, 18, fill=1, stroke=0)
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 7.2); c.drawString(compliance_x + 9, tech_top - 34, "NORMAS Y CUMPLIMIENTO")
    standards = [item.strip() for item in product["standards"].split("·")]
    for i, item in enumerate(standards):
        yy = tech_top - 61 - i * 25
        c.setStrokeColor(RED); c.setLineWidth(1.2); c.circle(compliance_x + 15, yy + 4, 6, fill=0, stroke=1)
        c.setFillColor(RED); c.setFont("Helvetica-Bold", 7); c.drawCentredString(compliance_x + 15, yy + 1.5, "✓")
        c.setFillColor(INK); c.setFont("Helvetica", 6.8); c.drawString(compliance_x + 28, yy + 1, item)
    paragraph(c, "Valores nominales basados en la ficha de familia del fabricante. Confirmar presentación, metraje y tolerancias al cotizar.", SMALL, compliance_x + 7, tech_top - 181, 139, 40)

    # Footer matching the red/black Speednet treatment.
    c.setFillColor(RED); c.rect(0, 0, 210, 47, fill=1, stroke=0)
    c.setFillColor(DARK); c.rect(210, 0, 385, 47, fill=1, stroke=0)
    c.setFillColor(WHITE); c.setFont("Helvetica-BoldOblique", 17); c.drawString(25, 19, "SPEEDNET")
    c.setFont("Helvetica-Bold", 7); c.drawString(232, 27, "FIBER ELECTRONICS S.A.S.")
    c.setFont("Helvetica", 6.5); c.drawString(232, 15, "ventas@fibersas.com  ·  +57 313 499 1444  ·  www.fibersas.com")
    c.save()
    print(path)


for product in PRODUCTS:
    build(product)
