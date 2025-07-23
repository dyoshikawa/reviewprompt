# reviewprompt

reviewprompt は、GitHub の Pull Request のレビューコメントを取得し AI プロンプトを構築する CLI ツールです。

GitHub PR上でレビューコメントをすると、それをAIコーディングツールへの修正指示にそのまま転用することができます。

本文に `@ai` が含まれるレビューコメントを対象に取得し、 `=====` で連結してプロンプトを構築する。

```例:
npx reviewprompt https://github.com/dyoshikawa/reviewprompt/pull/1
# 出力:
# ./src/xxx.ts:L1-L10
# ここをもっとこうして。
# =====
# ./src/yyy.ts:L1-L10
# ここをもっとああして。
```

## npx reviewprompt

`@ai` が含まれるレビューコメントをすべて取得し、連結してプロンプトを構築。デフォルトはコンソール出力で、 `--clipboard` でクリップボードに出力する。

--interactive 対話モードで実行する。`@ai` が含まれるレビューコメントをスペースキーで選択し、Enterキーでプロンプトを構築する
--resolve プロンプトを構築した後に、`@ai` が含まれるレビューコメントを解決済みにする
--delete プロンプトを構築した後に、`@ai` が含まれるレビューコメントを削除する
--mention メンションを `@ai` から変更したい場合。例: `@llm` `@claudecode`
--clipboard クリップボードに出力する

```例
npx reviewprompt https://github.com/dyoshikawa/reviewprompt/pull/1
```

## npx reviewprompt resolve

コメントを解決済みにする。デフォルトは対話モード起動。スペースキーで選択、Enterキーで解決済みにする。

--all 対話モード起動せず、 `@ai` を含む全てのコメントを解決済みにする
--mention メンションを `@ai` から変更したい場合。例: `@llm` `@claudecode`

```例
npx reviewprompt resolve
```

## npx reviewprompt delete
コメントを削除する。デフォルトは対話モード起動。スペースキーで選択、Enterキーで削除する。

--all 対話モード起動せず、 `@ai` を含む全てのコメントを削除する
--mention メンションを `@ai` から変更したい場合。例: `@llm` `@claudecode`

```例
npx reviewprompt delete
```
