from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "fichas-tecnicas" / "cable-fibra"
LOGO = ROOT / "img" / "logos" / "fiber.png"
OUTPUT.mkdir(parents=True, exist_ok=True)

RED = colors.HexColor("#d71920")
NAVY = colors.HexColor("#111827")
MUTED = colors.HexColor("#475569")
LIGHT = colors.HexColor("#f3f4f6")

PRODUCTS = [
    dict(slug="monomodo-armada-os2-12-hilos", family="Monomodo", construction="Armada GYXTW", fiber="OS2 9/125 µm", count=12, standard="ITU-T G.652.D"),
    *[
        dict(
            slug=f"multimodo-{construction_slug}-{fiber.lower()}-{count}-hilos",
            family="Multimodo",
            construction=construction,
            fiber=f"{fiber} 50/125 µm",
            count=count,
            standard="TIA/EIA-492AAAC" if fiber == "OM3" else "TIA/EIA-492AAAD",
        )
        for construction_slug, construction in (("indoor-outdoor", "Indoor / Outdoor"), ("armada", "Armada GYXTW"))
        for fiber in ("OM3", "OM4")
        for count in (6, 12)
    ],
]


def specs(product):
    if product["construction"].startswith("Armada"):
        return [
            ("Construcción", "Tubo holgado con gel, cinta bloqueadora de agua y armadura de acero corrugado"),
            ("Cubierta", "Polietileno negro (PE)"),
            ("Resistencia al aplastamiento", "1.000 N/100 mm"),
            ("Carga máxima de tracción", "1.500 N"),
            ("Diámetro exterior nominal", "8,3 ± 0,2 mm"),
            ("Peso nominal", "70 kg/km"),
            ("Radio mínimo de curvatura", "10D instalado / 20D bajo carga"),
            ("Temperatura de operación", "-20 °C a +60 °C"),
            ("Miembros de fuerza", "Dos alambres de acero paralelos"),
            ("Longitud estándar de carrete", "2 km; venta por metros sujeta a disponibilidad"),
        ]
    return [
        ("Construcción", "Tubo holgado con gel y miembros de fuerza de hilo de vidrio, no metálica"),
        ("Cubierta", "PE o LSZH"),
        ("Resistencia al aplastamiento", "1.000 N/100 mm"),
        ("Carga máxima de tracción", "800 N"),
        ("Diámetro exterior nominal", "6,0 ± 0,2 mm"),
        ("Peso nominal", "35 kg/km"),
        ("Radio mínimo de curvatura", "10D instalado / 20D bajo carga"),
        ("Temperatura de operación", "-20 °C a +60 °C"),
        ("Temperatura de almacenamiento", "-40 °C a +70 °C"),
        ("Longitud estándar de carrete", "2 km; venta por metros sujeta a disponibilidad"),
    ]


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="Brand", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9, textColor=MUTED, leading=12))
styles.add(ParagraphStyle(name="TitleFE", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=23, leading=26, textColor=NAVY, alignment=TA_LEFT, spaceAfter=3 * mm))
styles.add(ParagraphStyle(name="LeadFE", parent=styles["BodyText"], fontSize=9, leading=12, textColor=MUTED, spaceAfter=2.5 * mm))
styles.add(ParagraphStyle(name="SectionFE", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=11, textColor=RED, spaceBefore=2.5 * mm, spaceAfter=1.5 * mm))
styles.add(ParagraphStyle(name="SmallFE", parent=styles["BodyText"], fontSize=7.3, leading=8.5, textColor=MUTED))
styles.add(ParagraphStyle(name="CenterFE", parent=styles["BodyText"], fontSize=8.5, leading=11, alignment=TA_CENTER, textColor=NAVY))


def build(product):
    path = OUTPUT / f"{product['slug']}.pdf"
    doc = SimpleDocTemplate(
        str(path), pagesize=letter, rightMargin=18 * mm, leftMargin=18 * mm,
        topMargin=10 * mm, bottomMargin=9 * mm,
        title=f"Ficha técnica - {product['family']} {product['construction']} {product['fiber']} {product['count']} hilos",
        author="Fiber Electronics S.A.S.",
    )
    story = []
    logo = Image(str(LOGO), width=30 * mm, height=15 * mm)
    header = Table([[logo, Paragraph("FICHA TÉCNICA<br/>CABLE DE FIBRA ÓPTICA", styles["Brand"])]], colWidths=[45 * mm, 128 * mm])
    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("LINEBELOW", (0, 0), (-1, -1), 1.5, RED),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5 * mm),
    ]))
    story += [header, Spacer(1, 4 * mm)]
    type_name = product["fiber"].split()[0]
    story.append(Paragraph(f"Cable {product['family']} {type_name}<br/>{product['construction']} · {product['count']} hilos", styles["TitleFE"]))
    applications = "ductos, canalizaciones, tendidos exteriores y redes de campus" if product["construction"].startswith("Armada") else "backbone, distribución, redes de campus y enlaces interiores/exteriores"
    story.append(Paragraph(f"Cable de fibra óptica para {applications}. Disponible para venta por metros y preparado para instalaciones que requieren estabilidad, baja atenuación y desempeño confiable.", styles["LeadFE"]))

    badges = Table([[product["family"].upper(), type_name, f"{product['count']} HILOS", "VENTA POR METROS"]], colWidths=[43 * mm] * 4)
    badges.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), RED), ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3), ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("GRID", (0, 0), (-1, -1), .5, colors.white),
    ]))
    story += [badges, Spacer(1, 2.5 * mm), Paragraph("Especificaciones técnicas", styles["SectionFE"])]

    rows = [["PARÁMETRO", "VALOR"], ["Tipo de fibra", product["fiber"]], ["Número de fibras", str(product["count"])], *specs(product)]
    table = Table(rows, colWidths=[62 * mm, 110 * mm], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.2), ("TEXTCOLOR", (0, 1), (-1, -1), NAVY),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white), ("BACKGROUND", (0, 2), (-1, -1), LIGHT),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
        ("GRID", (0, 0), (-1, -1), .35, colors.HexColor("#cbd5e1")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
    ]))
    story += [table, Spacer(1, 2 * mm), Paragraph("Aplicaciones y cumplimiento", styles["SectionFE"])]
    compliance = f"IEC 60794 · {product['standard']} · RoHS · ISO 9001:2015 · Identificación de fibras TIA/EIA-598"
    story.append(Paragraph(compliance, styles["LeadFE"]))
    notes = [
        "Los colores de fibra siguen la secuencia TIA/EIA-598.",
        "Las propiedades ópticas corresponden al estándar indicado para el tipo de fibra seleccionado.",
        "Los valores se han estandarizado a partir de las fichas de familia del fabricante. La disponibilidad de cubierta, presentación y metraje debe confirmarse al cotizar.",
    ]
    note_table = Table([[Paragraph(f"• {note}", styles["SmallFE"])] for note in notes], colWidths=[172 * mm])
    note_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), LIGHT), ("BOX", (0, 0), (-1, -1), .5, colors.HexColor("#cbd5e1")), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
    story += [note_table, Spacer(1, 3 * mm), Paragraph("Fiber Electronics S.A.S. · Bogotá, Colombia · ventas@fibersas.com · +57 313 499 1444 · www.fibersas.com", styles["CenterFE"])]
    doc.build(story)
    print(path)


for item in PRODUCTS:
    build(item)
