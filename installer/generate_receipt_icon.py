import os
from PIL import Image, ImageDraw, ImageFilter


def rounded_rect(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def create_receipt_icon(size=256):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    scale = size / 256.0

    # Shadow
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    rounded_rect(
        sdraw,
        [int(42 * scale), int(48 * scale), int(214 * scale), int(220 * scale)],
        radius=int(28 * scale),
        fill=(15, 23, 42, 80),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(int(8 * scale)))
    img.alpha_composite(shadow)

    # Background card
    rounded_rect(
        draw,
        [int(36 * scale), int(40 * scale), int(220 * scale), int(216 * scale)],
        radius=int(28 * scale),
        fill=(248, 250, 252, 255),
        outline=(37, 99, 235, 60),
        width=int(2 * scale),
    )

    # Receipt paper
    paper_box = [int(62 * scale), int(54 * scale), int(194 * scale), int(202 * scale)]
    rounded_rect(
        draw,
        paper_box,
        radius=int(14 * scale),
        fill=(255, 255, 255, 255),
        outline=(148, 163, 184, 255),
        width=int(2 * scale),
    )

    # Header band
    draw.rounded_rectangle(
        [int(72 * scale), int(64 * scale), int(184 * scale), int(84 * scale)],
        radius=int(6 * scale),
        fill=(37, 99, 235, 255),
    )

    # Logo dot
    draw.ellipse(
        [int(80 * scale), int(70 * scale), int(92 * scale), int(82 * scale)],
        fill=(255, 255, 255, 255),
    )

    # Lines on receipt
    line_color = (71, 85, 105, 255)
    for y in [98, 112, 126, 146]:
        draw.line(
            [(int(80 * scale), int(y * scale)), (int(176 * scale), int(y * scale))],
            fill=line_color,
            width=int(4 * scale),
        )

    # Amount bar
    draw.rounded_rectangle(
        [int(92 * scale), int(156 * scale), int(176 * scale), int(172 * scale)],
        radius=int(5 * scale),
        fill=(219, 234, 254, 255),
    )

    # Currency circle
    draw.ellipse(
        [int(150 * scale), int(150 * scale), int(186 * scale), int(186 * scale)],
        fill=(16, 185, 129, 255),
    )
    draw.line(
        [(int(163 * scale), int(157 * scale)), (int(173 * scale), int(175 * scale))],
        fill=(255, 255, 255, 255),
        width=int(4 * scale),
    )
    draw.line(
        [(int(173 * scale), int(157 * scale)), (int(163 * scale), int(175 * scale))],
        fill=(255, 255, 255, 255),
        width=int(4 * scale),
    )

    # Small checkmark near bottom
    draw.line(
        [(int(88 * scale), int(182 * scale)), (int(97 * scale), int(191 * scale)), (int(111 * scale), int(174 * scale))],
        fill=(34, 197, 94, 255),
        width=int(5 * scale),
        joint="curve",
    )

    return img


def generate_ico_file():
    sizes = [256, 128, 64, 48, 32, 16]
    frames = [create_receipt_icon(size) for size in sizes]

    os.makedirs("installer", exist_ok=True)
    os.makedirs("shell", exist_ok=True)

    frames[0].save(
        "installer/app_icon.ico",
        format="ICO",
        sizes=[(size, size) for size in sizes],
        append_images=frames[1:],
    )
    frames[0].save(
        "shell/app_icon.ico",
        format="ICO",
        sizes=[(size, size) for size in sizes],
        append_images=frames[1:],
    )
    print("Receipt icon files generated as installer/app_icon.ico and shell/app_icon.ico")


if __name__ == "__main__":
    generate_ico_file()
