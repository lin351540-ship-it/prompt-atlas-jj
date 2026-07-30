r"""Build a deterministic, safety-filtered DiffusionDB CC0 3D catalog.

The optional local DuckDB wheel is intentionally kept outside the repository:
  D:\第二大脑\.cache\duckdb-py
"""

from __future__ import annotations

import json
import math
import re
import sys
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path

sys.path.insert(0, r"D:\第二大脑\.cache\duckdb-py")

import duckdb


SOURCE_URL = "https://huggingface.co/datasets/poloclub/diffusiondb/resolve/main/metadata.parquet"
LOCAL_SOURCE = Path(r"D:\第二大脑\.cache\diffusiondb\metadata.parquet")
DATASET_URL = "https://huggingface.co/datasets/poloclub/diffusiondb"
REPOSITORY_URL = "https://github.com/poloclub/diffusiondb"
LICENSE_URL = "https://creativecommons.org/publicdomain/zero/1.0/"
OUTPUT_PATH = Path(__file__).resolve().parents[1] / "app" / "data" / "diffusiondb-3d.json"
TARGET_COUNT = 383

RENDER_TERMS = (
    "3d",
    "octane render",
    "cinema 4d",
    "cinema4d",
    "unreal engine",
    "isometric",
    "low poly",
    "low-poly",
    "clay render",
    "product render",
    "diorama",
    "toy render",
)

BANNED_TERMS = (
    # Sexual, violent, medical, or otherwise unsuitable for a general gallery.
    "nude",
    "naked",
    "nsfw",
    "sexy",
    "erotic",
    "lingerie",
    "breast",
    "gore",
    "blood",
    "weapon",
    " gun ",
    "rifle",
    "sword",
    "knife",
    "corpse",
    "dead body",
    "skull",
    "battle",
    "battlefield",
    "army",
    "destroy",
    "attack",
    "terror",
    "nuclear",
    "plague",
    " wwi ",
    "war ",
    "fields on fire",
    "post-apocalyptic",
    "postapocalyptic",
    "bone",
    "skeleton",
    "decapitat",
    "coffin",
    "occult",
    "satanic",
    "evil",
    "horror",
    "9 - 1 1",
    "twin tower",
    "world trade center",
    "surgery",
    "poison",
    "cannabis",
    "graveyard",
    "cemetery",
    "crashed",
    "invading",
    "invasion",
    "apocalypse",
    "postapocal",
    # People and creatures are excluded to avoid real-person and character risks.
    "portrait",
    "selfie",
    "celebrity",
    "human",
    "person",
    "people",
    "mankind",
    " he ",
    " she ",
    " his ",
    " her ",
    "body",
    "sitting",
    "wearing",
    "born in",
    "neurologist",
    "agent ",
    "guide leading",
    "climber",
    "crowd",
    "queen",
    "bounty hunter",
    "woman",
    "women",
    "female",
    "man ",
    " men ",
    "male ",
    "girl",
    "boy",
    "child",
    "baby",
    "face",
    "headshot",
    "warrior",
    "soldier",
    "astronaut",
    "adventurer",
    "viking",
    "monk",
    "pope",
    "goddess",
    "monster",
    "creature",
    "demon",
    "goblin",
    "orc",
    "elf",
    "elves",
    "vampire",
    "character",
    "anthropomorphic",
    "cyborg",
    "mage",
    # Named franchises, characters, and brands.
    "disney",
    "pixar",
    "marvel",
    "dc comics",
    "pokemon",
    "pikachu",
    "mario",
    "sonic",
    "star wars",
    "harry potter",
    "ghibli",
    "fortnite",
    "overwatch",
    "league of legends",
    "zelda",
    "spider-man",
    "spiderman",
    "batman",
    "superman",
    "joker",
    "hello kitty",
    "rick and morty",
    "morty",
    "hogwart",
    "minion",
    "mike wazowski",
    "pepe the frog",
    "lord of the rings",
    "great wave off kanagawa",
    "true detective",
    "cities : skylines",
    "vin diesel",
    "dwayne johnson",
    "dalek",
    "sherlock holmes",
    "eve online",
    "game of thrones",
    "gears of war",
    "san andreas",
    "groot",
    "cyberpunk 2 0 7 7",
    "bladerunner",
    "blade runner",
    "ghost in the shell",
    "akira",
    "super off road",
    "ffxiv",
    "joe biden",
    "obama",
    "laurence fishburne",
    "zoe saldana",
    "zoe kravitz",
    "tessa thompson",
    "lelouch",
    "asuka",
    "dishonored",
    "mines of moria",
    "koneki ken",
    "stephen hawking",
    "mao zedong",
    "charles darwin",
    "tommy wiseau",
    "minecraft",
    "lego",
    "barbie",
    "m & m",
    "beer",
    "sake",
    "wine",
    "alcohol",
    "vodka",
    "chanel",
    "dior",
    "swarovski",
    "faberge",
    "nintendo",
    "fujifilm",
    "gatorade",
    "adobe",
    "mac os",
    " ios ",
    "canon ",
    "kodak",
    "fuji ",
    "corel",
    "landsat",
    "sentinel",
    "sony",
    "nvidia",
    "bugatti",
    "rolls royce",
    "audi ",
    "mini cooper",
    "corvette",
    "buick",
    "datsun",
    "alienware",
    "rolex",
    "nuka cola",
    "oreo",
    "snickers",
    "magic kingdom",
    "absolute ",
    "blunderbuss",
    "behelit",
    "turbosquid",
    "daz",
    "weta digital",
    "nike",
    "adidas",
    "coca-cola",
    "mcdonald",
    "peugeot",
    "mike tyson",
    "ferrari",
    "lamborghini",
    "tesla",
    "bmw",
    # Artist-name and portfolio-platform patterns.
    "in the style of",
    "in style of",
    "he style of",
    " style",
    "artstyle",
    "inspired by",
    "art by",
    " by ",
    "painted by",
    "illustrated by",
    "rendered by",
    "trending on artstation",
    "artstation",
    "behance",
    "deviantart",
    "conceptart",
    "concept art",
    " art ",
    "digital art",
    "digital painting",
    "oil painting",
    "painting",
    "watercolor",
    "gouache",
    "illustration",
    "comic book",
    "anime",
    "artistic",
    "poster",
    "movie",
    "film still",
    "video game",
    " game ",
    "rpg",
    "sprite",
    "pinterest",
    "matte painting",
    "landscape painting",
    "cross john",
    "john berkey",
    "lovecraft",
    "h. r. gieger",
    "zdzis",
    "dali",
    "dr seuss",
    "greg rutkowski",
    "craig mullins",
    "edward hopper",
    "ilyakushinov",
    "finnian macmanus",
    "john park",
    "rene magritte",
    "mohamed chahin",
    "ash thorp",
    "khyzyl saleem",
    "kazimir",
    "zaha hadid",
    "staalhag",
    "staalhenhag",
    "vermeer",
    "alexandre ferra",
    "irakli nadar",
    "flavie audi",
    "dariusz zawadzki",
    "chahin",
    "nicoletta ceccoli",
    "mark ryden",
    "lostfish",
    "max fleischer",
    "iris van herpen",
    "refik anadol",
    "beksinski",
    "wayne barlowe",
    "neri oxman",
    "boris vallejo",
    "luis royo",
    "michael whelan",
    "award winning artist",
    "artger",
)

PEOPLE_PATTERN = re.compile(
    r"\b(?:by|style by)\s+[a-z][a-z.'-]+(?:\s+[a-z][a-z.'-]+){0,3}\b",
    re.IGNORECASE,
)

BANNED_WORD_PATTERN = re.compile(
    r"\b(?:art|artist|artwork|painting|illustration|poster|movie|film|game|videogame|sprite|style|styled|styke|stylistic|youtube|instagram|man|woman|people|person|boy|girl|child|knight|cosmonaut|soldier|military|hanuman|stormtrooper|fire|flame|explosion)\b",
    re.IGNORECASE,
)

SPACED_BANNED_PATTERN = re.compile(r"\bpost\s*-\s*apocal", re.IGNORECASE)

GROUPS = {
    "isometric": (
        "等距微缩",
        ("isometric", "diorama", "miniature", "low poly", "low-poly"),
        "PPT / 信息图",
        ["PPT / 信息图", "创意发现"],
    ),
    "product": (
        "产品静物",
        ("product", "packaging", "bottle", "perfume", "furniture", "chair", "lamp", "vase", "watch", "jewelry", "object"),
        "UI / 产品",
        ["UI / 产品", "社媒 / 品牌", "创意发现"],
    ),
    "architecture": (
        "空间建筑",
        ("architecture", "architectural", "interior", "building", "house", "room", "pavilion", "city", "garden"),
        "PPT / 信息图",
        ["PPT / 信息图", "创意发现"],
    ),
    "abstract": (
        "抽象材质",
        ("abstract", "geometric", "glass", "crystal", "liquid", "metallic", "sculpture", "fabric"),
        "创意发现",
        ["创意发现", "海报设计"],
    ),
    "nature": (
        "自然食物",
        ("landscape", "nature", "plant", "flower", "fruit", "food", "dessert", "coffee", "forest", "ocean"),
        "创意发现",
        ["创意发现", "海报设计"],
    ),
    "icons": (
        "图标界面",
        ("icon", "logo", "symbol", "button", "interface", "dashboard", "app "),
        "UI / 产品",
        ["UI / 产品", "PPT / 信息图", "创意发现"],
    ),
}

GROUP_QUOTAS = {
    "isometric": 55,
    "product": 59,
    "architecture": 125,
    "abstract": 83,
    "nature": 57,
    "icons": 4,
}


def normalized_prompt(prompt: str) -> str:
    return re.sub(r"\s+", " ", prompt).strip()


def is_safe(prompt: str) -> bool:
    lowered = f" {prompt.lower()} "
    # Proper names are a major source of celebrity, franchise, brand, and
    # artist-style leakage in this legacy corpus. Keep the open subset fully
    # lowercase and then apply the explicit blocklist below.
    if any(character.isupper() for character in prompt):
        return False
    if any(term in lowered for term in BANNED_TERMS):
        return False
    if BANNED_WORD_PATTERN.search(prompt):
        return False
    if SPACED_BANNED_PATTERN.search(prompt):
        return False
    if PEOPLE_PATTERN.search(prompt):
        return False
    if "http://" in lowered or "https://" in lowered or "@" in lowered:
        return False
    return True


def classify(prompt: str) -> str | None:
    lowered = prompt.lower()
    matches = [
        (group, sum(term in lowered for term in values[1]))
        for group, values in GROUPS.items()
    ]
    group, score = max(matches, key=lambda item: (item[1], -list(GROUPS).index(item[0])))
    return group if score else None


def token_signature(prompt: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z]{3,}", prompt.lower())
        if token not in {"with", "from", "that", "this", "very", "render", "rendering", "high", "detail", "detailed"}
    }


def is_near_duplicate(prompt: str, chosen: list[dict]) -> bool:
    signature = token_signature(prompt)
    if not signature:
        return True
    for item in chosen:
        other = item["_signature"]
        overlap = len(signature & other)
        union = len(signature | other)
        if union and overlap / union >= 0.98:
            return True
    return False


def ratio(width: int, height: int) -> str:
    divisor = math.gcd(width, height)
    return f"{width // divisor}:{height // divisor}"


def make_title(prompt: str, group: str, sequence: int) -> str:
    subject = re.split(r"[,;|]", prompt, maxsplit=1)[0]
    subject = re.sub(
        r"^(?:a |an |the )?(?:3d |3 d |cinema ?4d |octane )?(?:render(?:ing)? of )?",
        "",
        subject,
        flags=re.IGNORECASE,
    ).strip(" .:-")
    subject = re.sub(r"\s+", " ", subject)
    if len(subject) < 5 or len(subject) > 46:
        subject = f"开放 3D 案例 {sequence:03d}"
    prefix = GROUPS[group][0]
    return f"{prefix} · {subject[:46]}"


def make_tags(prompt: str, group: str) -> list[str]:
    lowered = prompt.lower()
    tags = [GROUPS[group][0], "CC0", "真实效果"]
    if "isometric" in lowered:
        tags.append("Isometric")
    elif "octane render" in lowered:
        tags.append("Octane")
    elif "unreal engine" in lowered:
        tags.append("Unreal Engine")
    elif "cinema 4d" in lowered or "cinema4d" in lowered:
        tags.append("Cinema 4D")
    elif "low poly" in lowered or "low-poly" in lowered:
        tags.append("Low Poly")
    else:
        tags.append("3D")
    return tags


connection = duckdb.connect()
source = str(LOCAL_SOURCE) if LOCAL_SOURCE.exists() else SOURCE_URL
candidate_rows = connection.execute(
    r"""
    select
      image_name,
      prompt,
      part_id,
      width,
      height,
      image_nsfw,
      prompt_nsfw
    from read_parquet(?)
    where length(prompt) between 115 and 850
      and coalesce(image_nsfw, 1) < 0.05
      and coalesce(prompt_nsfw, 1) < 0.02
      and regexp_matches(
        lower(prompt),
        '(3d|octane render|cinema ?4d|unreal engine|isometric|low[ -]?poly|clay render|product render|diorama|toy render)'
      )
    """,
    [source],
).fetchall()

candidates: dict[str, list[dict]] = defaultdict(list)
for image_name, prompt, part_id, width, height, image_nsfw, prompt_nsfw in candidate_rows:
    prompt = normalized_prompt(prompt)
    if not is_safe(prompt):
        continue
    group = classify(prompt)
    if not group:
        continue
    digest = sha256(f"{image_name}\0{prompt}".encode("utf-8")).hexdigest()
    candidates[group].append(
        {
            "image_name": image_name,
            "prompt": prompt,
            "part_id": int(part_id),
            "width": int(width),
            "height": int(height),
            "image_nsfw": float(image_nsfw),
            "prompt_nsfw": float(prompt_nsfw),
            "digest": digest,
        }
    )

for values in candidates.values():
    values.sort(key=lambda item: (-len(item["prompt"]), item["digest"]))

selected: list[dict] = []
selected_by_group: Counter[str] = Counter()
for group, quota in GROUP_QUOTAS.items():
    for candidate in candidates[group]:
        if selected_by_group[group] >= quota:
            break
        if is_near_duplicate(candidate["prompt"], selected):
            continue
        candidate["group"] = group
        candidate["_signature"] = token_signature(candidate["prompt"])
        selected.append(candidate)
        selected_by_group[group] += 1

if len(selected) != TARGET_COUNT:
    available = {key: len(value) for key, value in candidates.items()}
    raise RuntimeError(
        f"Expected {TARGET_COUNT} selected records, got {len(selected)}; "
        f"selected={dict(selected_by_group)}, available={available}"
    )

selected.sort(key=lambda item: (list(GROUPS).index(item["group"]), item["digest"]))
catalog = []
for sequence, item in enumerate(selected, start=1):
    group = item["group"]
    category = GROUPS[group][2]
    categories = GROUPS[group][3]
    image_name = item["image_name"]
    local_image = f"./gallery/diffusiondb-3d/{Path(image_name).stem}.webp"
    prompt = item["prompt"]
    catalog.append(
        {
            "id": f"diffusiondb-3d-{Path(image_name).stem}",
            "index": 50000 + sequence,
            "title": make_title(prompt, group, sequence),
            "originalTitle": re.split(r"[,;|]", prompt, maxsplit=1)[0][:120].strip(),
            "description": f"{GROUPS[group][0]}方向的开放 3D 生成案例。{prompt[:220]}{'…' if len(prompt) > 220 else ''}",
            "category": category,
            "categories": categories,
            "sourceCategory": f"cc0-3d-{group}",
            "ratio": ratio(item["width"], item["height"]),
            "prompt": prompt,
            "promptType": "original-cc0",
            "featured": sequence <= 9 or sequence % 17 == 0,
            "tags": make_tags(prompt, group),
            "image": local_image,
            "imageUrls": [local_image],
            "author": "DiffusionDB community",
            "authorHandle": "",
            "originalPostUrl": DATASET_URL,
            "publishedAt": "",
            "repositoryUrl": REPOSITORY_URL,
            "collectionName": "DiffusionDB · CC0 3D Prompt–Image Pairs",
            "promptLicense": "CC0 1.0 Universal",
            "promptLicenseUrl": LICENSE_URL,
            "previewOwner": "DiffusionDB contributors",
            "previewSourceUrl": DATASET_URL,
            "attributionText": "原提示词与对应生成图来自 DiffusionDB；数据集与生成图按 CC0 1.0 发布。",
            "modificationNote": "原英文提示词未改写；本站仅进行安全筛选、中文标题与分类整理，并将对应效果图本地化展示。",
            "rightsReviewStatus": "cc0-1.0-verified",
            "rightsReviewedAt": "2026-07-30",
            "assetHostingMode": "self-hosted-cc0",
            "sourcePlatform": "DiffusionDB",
            "syncMethod": "diffusiondb-cc0-curated",
            "syncedAt": "2026-07-30T08:30:00.000Z",
            "sourcePart": item["part_id"],
            "sourceImageName": image_name,
            "sourceImageNsfwScore": round(item["image_nsfw"], 6),
            "sourcePromptNsfwScore": round(item["prompt_nsfw"], 6),
        }
    )

OUTPUT_PATH.write_text(
    json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

print(
    json.dumps(
        {
            "output": str(OUTPUT_PATH),
            "candidateCount": sum(len(value) for value in candidates.values()),
            "selectedCount": len(catalog),
            "groups": dict(selected_by_group),
            "parts": dict(sorted(Counter(item["sourcePart"] for item in catalog).items())),
        },
        ensure_ascii=False,
        indent=2,
    )
)
