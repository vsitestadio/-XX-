<?php
header("Content-Type: application/json");

// JSON受信
$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
  echo json_encode(["status" => "error", "message" => "Invalid data"]);
  exit;
}

$name = htmlspecialchars($input["name"] ?? "プレイヤー", ENT_QUOTES, "UTF-8");
$distance = intval($input["distance"] ?? 0);
$difficulty = $input["difficulty"] ?? "Normal";

$data = [
  "name" => $name,
  "distance" => $distance,
  "difficulty" => $difficulty,
  "created_at" => date("Y-m-d H:i:s")
];

$file = "scores.json";

// 既存データ読み込み
$scores = [];
if (file_exists($file)) {
  $scores = json_decode(file_get_contents($file), true) ?? [];
}

// 追加
$scores[] = $data;

// 保存
file_put_contents($file, json_encode($scores, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

echo json_encode(["status" => "success"]);
