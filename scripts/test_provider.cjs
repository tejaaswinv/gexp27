// Offline tests for Sub2API's native Responses API request and parser.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const source = fs.readFileSync(path.join(__dirname, "../lib/ai-provider.ts"), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
const loaded = new Function("module", "exports", "require", js);
loaded(mod, mod.exports, require);
const { extractModelText, requestProviderText, requestWithModelFallback } = mod.exports;

const valid = '{"selections":[{"id":1,"reason":"Strong evidence for the tracks."},{"id":2,"reason":"Course mapping is available."},{"id":3,"reason":"Regional preference match."},{"id":4,"reason":"Relevant interdisciplinary work."}]}';
const responseFixture = {
  id: "resp_test", object: "response", status: "completed",
  output: [
    { type: "reasoning", content: [{ type: "reasoning_text", text: "not for parsing" }] },
    { type: "message", role: "assistant", content: [{ type: "output_text", text: valid }] },
  ],
};
assert.equal(extractModelText(responseFixture, "responses"), valid);
assert.equal(extractModelText({ status: "completed", output_text: valid }, "responses"), valid);
assert.throws(() => extractModelText({ status: "incomplete", incomplete_details: { reason: "max_output_tokens" } }, "responses"), /incomplete/);
assert.throws(() => extractModelText({ status: "completed", output: [{ type: "reasoning", content: [] }] }, "responses"), /no assistant text/);
assert.equal(extractModelText({ choices: [{ message: { content: valid } }] }, "openai"), valid);
assert.equal(extractModelText({ content: [{ type: "text", text: valid }] }, "anthropic"), valid);

(async () => {
  let requests = 0;
  const cfg = {
    apiKey: "dummy-test-key", model: "deepseek-v4-pro-ga-260813", protocol: "responses",
    baseUrl: "https://api.miaoquai.com/v1",
    systemPrompt: "Return JSON with four university IDs.",
    userInput: '{"student":{"gpa":3.56,"pillar":"CSD"}}',
  };
  const result = await requestProviderText({
    ...cfg,
    fetchImpl: async (url, options) => {
      requests++;
      assert.equal(url, "https://api.miaoquai.com/v1/responses");
      assert.equal(options.method, "POST");
      assert.equal(options.headers.Authorization, "Bearer dummy-test-key");
      const body = JSON.parse(options.body);
      assert.equal(body.model, "deepseek-v4-pro-ga-260813");
      assert.equal(body.input, cfg.userInput);
      assert.equal(body.instructions, cfg.systemPrompt);
      assert.equal(body.text.format.type, "json_object");
      assert.equal(body.reasoning.effort, "none");
      assert.equal(body.messages, undefined);
      assert.equal(body.stream, undefined);
      return Response.json(responseFixture);
    },
  });
  assert.equal(requests, 1);
  assert.equal(result, valid);
  await assert.rejects(
    () => requestProviderText({
      ...cfg,
      fetchImpl: async () => Response.json(
        { error: { code: "api_error", message: "no available accounts" } }, { status: 503 },
      ),
    }),
    /no available upstream accounts/,
  );
  let fallbackRequests = 0;
  const failover = await requestWithModelFallback({
    ...cfg,
    fallbackModel: "deepseek-v4-1-flash-260910",
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      fallbackRequests++;
      if (fallbackRequests === 1) {
        assert.equal(body.model, "deepseek-v4-pro-ga-260813");
        return Response.json({ error: { code: "api_error", message: "upstream unavailable" } }, { status: 503 });
      }
      assert.equal(body.model, "deepseek-v4-1-flash-260910");
      return Response.json(responseFixture);
    },
  });
  assert.equal(fallbackRequests, 2);
  assert.equal(failover.model, "deepseek-v4-1-flash-260910");
  assert.equal(failover.usedFallback, true);
  assert.equal(failover.text, valid);
  const noFailover = await requestWithModelFallback({
    ...cfg,
    fallbackModel: "deepseek-v4-1-flash-260910",
    fetchImpl: async () => Response.json(responseFixture),
  });
  assert.equal(noFailover.model, cfg.model);
  assert.equal(noFailover.usedFallback, false);
  console.log("DeepSeek Responses adapter tests passed.");
})().catch((err) => { console.error(err); process.exitCode = 1; });
