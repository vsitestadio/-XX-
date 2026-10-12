<?php
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data["name"], $data["distance"], $data["difficulty"])) {
  echo json_encode(["error" => "invalid input"]);
  exit;
}

$name = trim($data["name"]);
$distance = (int)$data["distance"];
$difficulty = $data["difficulty"];

$file = "ranking_" . strtolower($difficulty) . ".json";

$ranking = [];
if (file_exists($file)) {
  $ranking = json_decode(file_get_contents($file), true) ?? [];
}

// スコア追加
$ranking[] = [
  "name" => $name,
  "distance" => $distance,
  "time" => time()
];

// 距離が短い順（優秀）
usort($ranking, function ($a, $b) {
  return $a["distance"] <=> $b["distance"];
});

// 上位5件
$ranking = array_slice($ranking, 0, 5);

file_put_contents($file, json_encode($ranking, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

// ★ player として今回の名前を返す
echo json_encode([
  "ranking" => $ranking,
  "player" => $name
], JSON_UNESCAPED_UNICODE);
