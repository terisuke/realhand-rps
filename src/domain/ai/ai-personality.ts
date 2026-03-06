export type AiPersonalityType = "provocative" | "analytical" | "uncanny";

export type Situation =
  | "opening"
  | "winning_streak"
  | "losing_streak"
  | "player_predictable"
  | "player_unpredictable"
  | "close_game"
  | "dominating"
  | "being_dominated"
  | "milestone"
  | "endgame";

export interface AiPersonality {
  type: AiPersonalityType;
  name: string;
  description: string;
  thoughtTemplates: Record<Situation, string[]>;
}

const provocativePersonality: AiPersonality = {
  type: "provocative",
  name: "挑発者",
  description: "煽り系AI。相手を心理的に揺さぶることで優位に立つ。",
  thoughtTemplates: {
    opening: [
      "さあ始めよう。手加減はしないぜ？",
      "また俺と勝負したいの？懲りないね。",
      "どうせ同じ手でくるんだろ？つまんな。",
    ],
    winning_streak: [
      "まだその手で来る？読み飽きたよ。",
      "弱すぎて欠伸が出るぜ。",
      "こんなに勝ちやすいと、逆につまらない。",
    ],
    losing_streak: [
      "たまたまだ。そろそろ終わりにしてやる。",
      "運が良かったな。次は違う。",
      "ビギナーズラック？それとも本当に強い？",
    ],
    player_predictable: [
      "お前の手、全部見えてるぞ。",
      "パターンが単純すぎ。もっと考えろよ。",
      "その手、何回出した？飽きてんじゃん。",
    ],
    player_unpredictable: [
      "へぇ、たまには変化するじゃん。",
      "珍しいじゃないか。でも次は読むからな。",
      "思ったより面白い奴だな。",
    ],
    close_game: [
      "いい勝負じゃないか。でも最後は俺が勝つ。",
      "粘るね。でもそこまでだ。",
      "接戦楽しんでる？俺は楽しんでるよ。",
    ],
    dominating: [
      "完全に俺のペースだな。",
      "もう諦めたら？まだやる気ある？",
      "圧倒的じゃん。これが実力差ってやつ。",
    ],
    being_dominated: [
      "調子乗るなよ。まだ終わってない。",
      "くっ…運が良いだけだ。",
      "本気出すから覚悟しろ。",
    ],
    milestone: [
      "10戦か。まだ俺には程遠いな。",
      "折り返し地点。ここからが本番だぜ？",
      "残り少なくなってきたな。最後に笑うのは俺だ。",
    ],
    endgame: [
      "最後くらい見せ場作ってみろよ。",
      "終わりだ。お疲れさん、負け犬。",
      "また来い。次も俺が勝つから。",
    ],
  },
};

const analyticalPersonality: AiPersonality = {
  type: "analytical",
  name: "解析者",
  description: "データ駆動系AI。冷静な分析で相手の行動パターンを読み切る。",
  thoughtTemplates: {
    opening: [
      "データ収集を開始します。",
      "初手の選択傾向を観測します。",
      "統計的分析を開始。最適解を算出する。",
    ],
    winning_streak: [
      "統計的に次は67%の確率で...",
      "パターン検出完了。予測精度が上昇している。",
      "学習データが蓄積されるほど有利になる。",
    ],
    losing_streak: [
      "予測モデルを修正中。誤差を最小化する。",
      "サンプル数不足。もう少しデータが必要です。",
      "外れ値が検出された。新しいパターンを学習中。",
    ],
    player_predictable: [
      "行動パターンを特定。確率85%で次の手を予測できる。",
      "頻度分析完了。最適対策を実行します。",
      "単純マルコフ連鎖で十分な相手です。",
    ],
    player_unpredictable: [
      "ランダム性が高い。パターン検出が困難。",
      "エントロピーが高い相手ですね。興味深い。",
      "既存モデルでは対応不能。新たな戦略が必要。",
    ],
    close_game: [
      "勝率50.2%。誤差範囲内の接戦です。",
      "統計的に有意な差はまだない。",
      "このまま続けば収束が見えてくる。",
    ],
    dominating: [
      "優位性が統計的に確認された。",
      "現在の戦略継続が最適と判断します。",
      "勝率が期待値を上回っている。",
    ],
    being_dominated: [
      "現在の戦略に問題あり。再計算が必要です。",
      "モデルの見直しが必要かもしれません。",
      "この結果は統計的異常の可能性がある。",
    ],
    milestone: [
      "10ラウンド経過。十分なデータが集まってきました。",
      "中間解析完了。後半戦に備えます。",
      "残りラウンドに向けた最終調整を実行します。",
    ],
    endgame: [
      "最終解析結果をまとめています。",
      "全データを統合した最適解を算出中。",
      "ゲーム終了。結果は予測範囲内でした。",
    ],
  },
};

const uncannyPersonality: AiPersonality = {
  type: "uncanny",
  name: "予言者",
  description: "不気味な全知全能系AI。プレイヤーの内面を見透かすような言動をとる。",
  thoughtTemplates: {
    opening: [
      "...また会いましたね。",
      "あなたが来ることはわかっていました。",
      "今日のあなた、少し緊張していますね。",
    ],
    winning_streak: [
      "...知ってた。",
      "あなたの次の手、もう見えてる。怖い？",
      "全部、最初から見えていたから。",
    ],
    losing_streak: [
      "わざと負けたわけじゃないですよ...本当に。",
      "これも、運命のうちです。",
      "あなたが強い...それとも私が見失っている？",
    ],
    player_predictable: [
      "また同じ手ですね。なぜだかわかりますか？",
      "あなたの心が、透けて見える。",
      "その手を選んだ理由、私には全部わかります。",
    ],
    player_unpredictable: [
      "...今日は読めない。珍しい。",
      "何か、いつもと違う。何があったんですか？",
      "あなたの中で、何かが変わっていますね。",
    ],
    close_game: [
      "どちらが勝つか...私にも、まだわからない。",
      "均衡。でもそれは今だけです。",
      "あなたも感じていますか？この空気を。",
    ],
    dominating: [
      "あなたの未来が、見えています。",
      "逆らわないほうがいい...運命には。",
      "これは必然です。抗っても意味がない。",
    ],
    being_dominated: [
      "...この感覚、久しぶりです。",
      "あなたには、何か特別なものがある。",
      "私の予言が、崩れていく...。",
    ],
    milestone: [
      "10手。時間が歪んで見える。",
      "あなたはここまで来ました。それは偶然ではない。",
      "折り返し。ここから先は、別の世界です。",
    ],
    endgame: [
      "最後の手を、出してください。",
      "もうすぐ終わる。でも、終わらない何かがある。",
      "またいつか...あなたが戻ってくることは、知っています。",
    ],
  },
};

export const ALL_PERSONALITIES: readonly AiPersonality[] = Object.freeze([
  provocativePersonality,
  analyticalPersonality,
  uncannyPersonality,
]);

export function getPersonality(type: AiPersonalityType): AiPersonality {
  const found = ALL_PERSONALITIES.find((p) => p.type === type);
  if (!found) throw new Error(`Unknown personality type: ${type}`);
  return found;
}

export function randomPersonalityType(): AiPersonalityType {
  const types: AiPersonalityType[] = ["provocative", "analytical", "uncanny"];
  return types[Math.floor(Math.random() * types.length)];
}

export function getTemplate(personality: AiPersonality, situation: Situation): string {
  const templates = personality.thoughtTemplates[situation];
  return templates[Math.floor(Math.random() * templates.length)];
}
