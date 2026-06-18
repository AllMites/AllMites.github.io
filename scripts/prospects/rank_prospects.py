#!/usr/bin/env python3
"""Rank prospects by composite score, apply diversity caps, output CSVs."""

import json, csv, sys, io
from collections import defaultdict

# Read the prospects JSON
with open(r"F:\Documents\Repositories\WebsiteDropshipping\prospects_input.json", "r", encoding="utf-8") as f:
    prospects = json.load(f)

print(f"Loaded {len(prospects)} prospects from file")
OUTPUT_CSV_FIELDS = [
    "rank","name","area","business_type","phone","maps_url","facebook_url",
    "website_url","rating","review_count","social_activity","owner_name",
    "owner_phone_visible","score_tf","score_pg","score_rs","score_or","score_pd",
    "composite","reasoning"
]

def csv_escape(val):
    s = str(val) if val is not None else ""
    if ',' in s or '"' in s or '\n' in s or '\r' in s:
        return '"' + s.replace('"', '""') + '"'
    return s

def row_to_csv(rank, p):
    vals = [
        rank, p.get("name",""), p.get("area",""), p.get("business_type",""),
        p.get("phone",""), p.get("maps_url",""), p.get("facebook_url",""),
        p.get("website_url",""), p.get("rating",0), p.get("review_count",0),
        p.get("social_activity",""), p.get("owner_name",""),
        str(p.get("owner_phone_visible",False)).lower(),
        p.get("score_tf",0), p.get("score_pg",0), p.get("score_rs",0),
        p.get("score_or",0), p.get("score_pd",0), p.get("composite",0)
    ]
    parts = [csv_escape(v) for v in vals]
    # reasoning always wrapped
    r = p.get("reasoning","")
    parts.append('"' + r.replace('"', '""') + '"')
    return ",".join(parts)

# Sort
sorted_prospects = sorted(prospects, key=lambda p: (-p["composite"], -p["score_tf"], -p["score_rs"]))

# Diversity cap: track business_type+area combos
type_area_count = defaultdict(list)
for i, p in enumerate(sorted_prospects):
    key = (p["business_type"], p["area"])
    type_area_count[key].append(i)

adjustments = {}
for key, indices in type_area_count.items():
    if len(indices) > 3:
        in_top20 = [idx for idx in indices if idx < 20]
        if len(in_top20) > 3:
            for idx in in_top20[3:]:
                adjustments[idx] = max(adjustments.get(idx, 0), -2)
        in_top40 = [idx for idx in indices if idx < 40]
        if len(in_top40) > 5:
            for idx in in_top40[5:]:
                if idx not in adjustments:
                    adjustments[idx] = -1

for idx, adj in adjustments.items():
    p = sorted_prospects[idx]
    p["score_pd"] = max(1, p["score_pd"] + adj)
    p["composite"] = max(1, p["composite"] + adj)

# Re-sort
sorted_prospects = sorted(prospects, key=lambda p: (-p["composite"], -p["score_tf"], -p["score_rs"]))

# Build CSVs
header = ",".join(OUTPUT_CSV_FIELDS)

top40_lines = [header]
for i, p in enumerate(sorted_prospects[:40]):
    top40_lines.append(row_to_csv(i+1, p))
top40_csv = "\n".join(top40_lines)

all_lines = [header]
for i, p in enumerate(sorted_prospects):
    all_lines.append(row_to_csv(i+1, p))
all_csv = "\n".join(all_lines)

# Write output files
with open(r"F:\Documents\Repositories\WebsiteDropshipping\temp_top40.csv", "w", encoding="utf-8") as f:
    f.write(top40_csv)

with open(r"F:\Documents\Repositories\WebsiteDropshipping\temp_all.csv", "w", encoding="utf-8") as f:
    f.write(all_csv)

# Compute summary
top40 = sorted_prospects[:40]
cafes = sum(1 for p in top40 if p["business_type"] in ("cafe", "café"))
barbershops = sum(1 for p in top40 if p["business_type"] == "barbershop")
trades = sum(1 for p in top40 if p["business_type"] in ("plumber", "electrician"))
min_c = top40[-1]["composite"]
max_c = top40[0]["composite"]

from collections import Counter
area_counts = Counter(p["area"] for p in top40)
top_areas = ", ".join(f"{a}({c})" for a, c in area_counts.most_common(5))

type_counts = Counter(p["business_type"] for p in top40)

summary = (
    f"Top 40 composite range: {min_c}–{max_c}. "
    f"Distribution: {cafes} cafés, {trades} trades (plumbers+electricians), {barbershops} barbershops. "
    f"Top areas: {top_areas}. "
    f"Diversity caps applied where same business_type+area exceeded 3 in top 20 or 5 in top 40."
)

print("=== SUMMARY ===")
print(summary)
print(f"\nBusiness type breakdown in top 40: {dict(type_counts)}")
print(f"\nAdjustments applied: {len(adjustments)} records")
for idx, adj in sorted(adjustments.items()):
    p = sorted_prospects[idx]
    print(f"  Rank {idx+1}: {p['name']} ({p['business_type']}, {p['area']}) adj={adj} new_pd={p['score_pd']} new_comp={p['composite']}")

print(f"\nTOP 40 CSV: {len(top40_csv)} chars")
print(f"ALL CSV: {len(all_csv)} chars")
print("DONE")