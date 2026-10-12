<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="css/community.css" rel="stylesheet" type="text/css">
<?php
mb_language("Japanese");
mb_internal_encoding("UTF-8");

// フォームデータ
$name    = trim($_POST['name']);
$email   = trim($_POST['email']);
$subject_type = trim($_POST['subject']);
$comment = trim($_POST['comment']);

// バリデーション
$errors = [];
if ($name === "") {
    $errors[] = "名前を入力してください。";
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = "正しいメールアドレスを入力してください。";
}
if ($comment === "") {
    $errors[] = "コメントを入力してください。";
}
if ($errors) {
    echo "<div class='send-back>";
    echo implode("<br>", $errors);
    echo "<br><br><button onclick=\"history.back()\" class='b-back'>戻る</button>";
    echo "</div>";
    exit;
}

// --- メール本文（UTF-8） ---
$body = "以下の内容でお問い合わせがありました。\n\n"
      . "＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝\n"
      . "■お名前\n{$name}\n\n"
      . "■メールアドレス\n{$email}\n\n"
      . "■種類\n{$subject_type}\n\n"
      . "■コメント\n{$comment}\n"
      . "＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝\n";

// --- 宛先・件名 ---
$to = "yukaisakusei@gmail.com";
$subject = "【お問い合わせ】" . $subject_type;

// --- ヘッダー設定（UTF-8対応） ---
$from = "info@yukai.secret.jp";
$headers = "";
$headers .= "From: {$from}\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "Content-Transfer-Encoding: 8bit\r\n";

// --- メール送信 ---
if (mb_send_mail($to, $subject, $body, $headers)) {
    echo "
    <div class='send'>
        <p class='b-send-item'>送信しました。ありがとうございます。</p>
        <button onclick=\"location.href='index.html'\" 
            class='b-send'>
            トップページに戻る
        </button>
    </div>
    ";
} else {
    echo "
    <div class='send'>
        <p class='b-send-item'>送信に失敗しました。時間をおいて再度お試しください。</p>
        <button onclick=\"history.back()\" class='b-back'>戻る</button>
    </div>
    ";
}
?>