module.exports = {
  "rid": "wovyn_base",
  "meta": {
    "use": [
      {
        "kind": "module",
        "rid": "io.picolabs.lesson_keys",
        "alias": "io.picolabs.lesson_keys"
      },
      {
        "kind": "module",
        "rid": "io.picolabs.twilio_v2",
        "alias": "twilio",
        "with": async function (ctx) {
          ctx.scope.set("account_sid", await ctx.applyFn(ctx.scope.get("get"), ctx, [
            await ctx.modules.get(ctx, "keys", "twilio"),
            "account_sid"
          ]));
          ctx.scope.set("auth_token", await ctx.applyFn(ctx.scope.get("get"), ctx, [
            await ctx.modules.get(ctx, "keys", "twilio"),
            "auth_token"
          ]));
        }
      },
      {
        "kind": "module",
        "rid": "temperature_store",
        "alias": "temperature_store"
      }
    ],
    "shares": ["__testing"]
  },
  "global": async function (ctx) {
    ctx.scope.set("__testing", {
      "queries": [],
      "events": [
        {
          "domain": "wovyn",
          "type": "heartbeat"
        },
        {
          "domain": "wovyn",
          "type": "heartbeat",
          "attrs": ["genericThing"]
        }
      ]
    });
    ctx.scope.set("temperature_threshold", 80);
    ctx.scope.set("to_notify_number", "19134019979");
    ctx.scope.set("twilio_number", "12017482171");
  },
  "rules": {
    "process_heartbeat": {
      "name": "process_heartbeat",
      "select": {
        "graph": { "wovyn": { "heartbeat": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("genericThing", await ctx.applyFn(ctx.scope.get("head"), ctx, [await ctx.applyFn(ctx.scope.get("klog"), ctx, [
            await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["genericThing"]),
            "GenericThing"
          ])]));
        ctx.scope.set("temperature", await ctx.applyFn(ctx.scope.get("head"), ctx, [await ctx.applyFn(ctx.scope.get("klog"), ctx, [
            await ctx.applyFn(ctx.scope.get("get"), ctx, [
              await ctx.applyFn(ctx.scope.get("get"), ctx, [
                ctx.scope.get("genericThing"),
                "data"
              ]),
              "temperature"
            ]),
            "TEMPERATURE"
          ])]));
        var fired = !await ctx.applyFn(ctx.scope.get("isnull"), ctx, [ctx.scope.get("genericThing")]);
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "say",
            { "something": "Hello" }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          await ctx.raiseEvent({
            "domain": "wovyn",
            "type": "new_temperature_reading",
            "attributes": {
              "temperature": ctx.scope.get("temperature"),
              "timestamp": await ctx.applyFn(await ctx.modules.get(ctx, "time", "now"), ctx, [])
            },
            "for_rid": undefined
          });
        }
      }
    },
    "find_high_temps": {
      "name": "find_high_temps",
      "select": {
        "graph": { "wovyn": { "new_temperature_reading": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("temperature", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["temperature"]));
        ctx.scope.set("temperatureF", await ctx.applyFn(ctx.scope.get("head"), ctx, [await ctx.applyFn(ctx.scope.get("klog"), ctx, [
            await ctx.applyFn(ctx.scope.get("get"), ctx, [
              ctx.scope.get("temperature"),
              ["temperatureF"]
            ]),
            "temperatureF"
          ])]));
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "say",
            { "recieved": "Y" }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          if (await ctx.applyFn(ctx.scope.get(">"), ctx, [
              ctx.scope.get("temperatureF"),
              ctx.scope.get("temperature_threshold")
            ]))
            await ctx.raiseEvent({
              "domain": "wovyn",
              "type": "threshold_violation",
              "attributes": await ctx.modules.get(ctx, "event", "attrs"),
              "for_rid": undefined
            });
        }
      }
    },
    "threshold_violation": {
      "name": "threshold_violation",
      "select": {
        "graph": { "wovyn": { "threshold_violation": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, "twilio", "send_sms", [
            ctx.scope.get("to_notify_number"),
            ctx.scope.get("twilio_number"),
            await ctx.applyFn(ctx.scope.get("+"), ctx, [
              "Temperature above threshold: ",
              ctx.scope.get("temperature_threshold")
            ])
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXNDb250ZW50IjpbXX0=
