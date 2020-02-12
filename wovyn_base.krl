ruleset wovyn_base {
	meta {
		use module io.picolabs.lesson_keys
		use module io.picolabs.twilio_v2 alias twilio
			with account_sid =  keys:twilio{"account_sid"}
				 auth_token = 	keys:twilio{"auth_token"}

		use module temperature_store.temperatures
		use module temperature_store.threshold_violations
		use module temperature_store.inrange_temperatures

		shares __testing
	}

	global {
		__testing = {
			"queries": [],
			"events": [
				{ "domain": "wovyn", "type": "heartbeat" },
				{ "domain": "wovyn", "type": "heartbeat", "attrs": [ "genericThing" ] }
			]
		}

		temperature_threshold = 80
		to_notify_number = "19134019979"
		twilio_number = "12017482171"

	}


	rule process_heartbeat {
		select when wovyn heartbeat

		pre {
			genericThing = event:attr("genericThing").klog("GenericThing").head()
			temperature = genericThing{"data"}{"temperature"}.klog("TEMPERATURE").head()
		}

		if (not genericThing.isnull()) then 
			send_directive("say", {"something": "Hello"})
		fired {
			raise wovyn event "new_temperature_reading" 
				attributes { "temperature": temperature, "timestamp": time:now() }
		} 
	}

	rule find_high_temps {
		select when wovyn new_temperature_reading
		
		pre {
			temperature = event:attr("temperature")
			temperatureF = temperature["temperatureF"].klog("temperatureF").head()
		}

		send_directive("say", {"recieved": "Y"})
		
		fired {
			raise wovyn event "threshold_violation"
				attributes event:attrs
		}
	}

	rule threshold_violation {
		select when wovyn threshold_violation

		twilio:send_sms(to_notify_number,
						twilio_number,
						"Temperature above threshold: " + temperature_threshold)
	}
}
