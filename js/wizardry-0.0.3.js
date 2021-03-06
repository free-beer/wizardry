$.fn.wizardry = function(configuration) {
   var api       = {autoApplyHandlers: function(context, markup) {
                                          var elements;

                                          elements = markup.find(".wizardry-next-control");
                                          if(elements.length > 0) {
                                             console.log("Auto-applying next control event handlers.");
                                             elements.click(function(event) {
                                                               context.target.trigger(jQuery.Event("wizardry.forward", {state: context.state}));
                                                            });
                                          }

                                          elements = markup.find(".wizardry-previous-control");
                                          if(elements.length > 0) {
                                             console.log("Auto-applying previous control event handlers.");
                                             elements.click(function(event) {
                                                               context.target.trigger(jQuery.Event("wizardry.backward", {state: context.state}));
                                                            });
                                          }

                                          elements = markup.find(".wizardry-restart-control");
                                          if(elements.length > 0) {
                                             console.log("Auto-applying restart control event handlers.");
                                             elements.click(function(event) {
                                                               context.target.trigger(jQuery.Event("wizardry.restart", {state: context.state}));
                                                            });
                                          }
                                       },
                    backward:          function(context) {
                                          console.log("Previous step regression requested, checking if a step is available. Progression:", context.progression);
                                          if(context.progression.length > 0) {
                                             var newOffset = context.progression.pop();

                                             console.log("Rewinding to step offset " + newOffset + ".");
                                             api.gotoOffset(context, newOffset);
                                          } else {
                                             console.log("No previous step available, doing nothing.");
                                          }
                                       },
                    currentStep:       function(context) {
                                          return(api.getStep(context, context.offset));
                                       },
                    getStep:           function(context, offset) {
                                          if(offset < 0 || offset >= context.configuration.length) {
                                             throw("Request for step details specified an invalid offset of " + offset + ".");
                                          }
                                          return(context.configuration[offset]);
                                       },
                    fetchTemplate:     function(context) {
                                          var step     = api.currentStep(context),
                                              template;

                                          if(!step.ui) {
                                             throw("No user interface configuration specified for step offset " + context.offset + ".");
                                          }

                                          if(step.ui.template) {
                                             if(step.ui.template.selector) {
                                                template = api.getTemplate(step.ui.template.selector);
                                             } else {
                                                throw("Invalid template user interface configuration for step offset " + context.offset + ".");
                                             }
                                          } else if(step.ui.url) {
                                             template = api.loadTemplate(step.ui.url, (step.ui.method || "GET"));
                                          } else {
                                             throw("Invalid or incomplete user interface configuration for step offset " + context.offset + ".");
                                          }

                                          return(template);
                                       },
                    forward:           function(context) {
                                          var step      = api.currentStep(context),
                                              permitted = true;

                                          console.log("Next step progression requested. Starting offset is " + context.offset + ".");
                                          if(step.onExit) {
                                             console.log("Step has progression validator, calling it.");
                                             permitted = (step.onExit(context.state, target, step) === true);
                                          }

                                          if(permitted) {
                                             var offset     = context.offset,
                                                 progressed = true;

                                             console.log("Progression to next step permitted, checking if a step is available.");
                                             if(step.getNextStepId) {
                                                var newId  = step.getNextStepId(state);

                                                if(!newId || !api.idExists(context, newId)) {
                                                   throw("Invalid step id '" + newId + "' returned by getNextStepId() call for step offset " + context.offset);
                                                }
                                                console.log("Progressing to step id '" + newId + "'.");
                                                api.gotoId(context, newId);
                                                progressed = true;
                                             } else {
                                                newOffset = context.offset + 1;
                                                if(api.isValidOffset(context, newOffset)) {
                                                   api.gotoOffset(context, newOffset);
                                                   progressed = true;
                                                } else {
                                                   console.log("Unable to move forward as there are no further steps.");
                                                }
                                             }

                                             console.log("Checking if we actually progressed a step.");
                                             if(progressed) {
                                                if(context.progression.length === 0 || context.progression[context.progression.length - 1] !== offset) {
                                                   console.log("Pushing step offset " + offset + " on to the progression list.");
                                                   context.progression.push(offset);
                                                }
                                             }
                                          } else {
                                             console.log("Progression to next step not permitted as onExit() did not return true.");
                                          }
                                       },
                    getTemplate:       function(selector) {
                                          var element = $("#" + selector);

                                          if(element.length === 0) {
                                             throw("Invalid template selector '" + selector + "' specified for step offset " + context.offset + ".");
                                          }
                                          return(element.html());
                                       },
                    gotoId:            function(context, id) {
                                          if(!api.idExists(context, id)) {
                                             throw("Move to step id '" + id + "' requested but there is no step possessing that id.");
                                          }
                                          api.gotoOffset(context, api.offsetForId(context, id));
                                       },
                    gotoOffset:        function(context, offset) {
                                          var step;

                                          console.log("Request to move to step offset " + offset + " received.");
                                          if(!api.isValidOffset(context, offset)) {
                                             throw("Request received to proceed to the invalid offset " + offset + ".");
                                          }

                                          step           = api.getStep(context, offset);
                                          context.offset = offset;
                                          if(step.onEnter) {
                                             step.onEnter(context.state, step);
                                          }
                                          api.showUI(context);
                                       },
                    idExists:          function(context, id) {
                                          return(context.configuration.findIndex(function(entry) {entry.id === id}) !== -1);
                                       },
                    isValidOffset:     function(context, offset) {
                                          return(offset >= 0 && offset < context.configuration.length);
                                       },
                    loadTemplate:      function(url, method) {
                                          var template,
                                              onSuccess   = function(data, status, jqXHR) {
                                                               console.log("Load of template from", url, "successful.");
                                                               template = data;
                                                            },
                                              onError     = function(jqXHR, status, error) {
                                                               console.log("Load of template from", url, "failed. Status:", status, ", Error:", error);
                                                            },
                                              settings    = {async:    false,
                                                             dataType: "html",
                                                             error:    onError,
                                                             method:   (method || "GET"),
                                                             success:  onSuccess,
                                                             url:      url};

                                          console.log("Loading template from " + url + ".");
                                          jQuery.ajax(url, settings);
                                          return(template);
                                       },
                    offsetForId:       function(context, id) {
                                          var offset,
                                              index = context.configuration.findIndex(function(entry) {entry.id === id});

                                          if(index !== -1) {
                                             offset = index;
                                          }

                                          return(offset);
                                       },
                    renderTemplate:    function(source, context) {
                                          var step = api.currentStep(context),
                                              data = {};

                                          if(step.templateData) {
                                            data = step.templateData(context.state);
                                          }

                                          data = jQuery.extend(data, context.state);
                                          console.log("Rendering the template with the data:", data);
                                          return($(Mustache.render(source, data)));
                                       },
                    restart:           function(context) {
                                          context.state = (context.initializeState ? context.initializeState(state) : {});
                                          api.gotoOffset(context, 0);
                                       },
                    showUI:            function(context) {
                                          var template = api.renderTemplate(api.fetchTemplate(context), context),
                                              step     = api.currentStep(context);

                                          console.log("Checking if any automatic event handlers are needed.");
                                          api.autoApplyHandlers(context, template);

                                          console.log("Showing the UI for the current context step.");
                                          api.transition(context, template, step.onShow);
                                       },
                    transition:        function(context, newMarkup, onShow) {
                                          var children = context.target.children(),
                                              step     = api.currentStep(context),
                                              onReveal = function() {
                                                            if(onShow) {
                                                               onShow(context.state, newMarkup);
                                                            }
                                                         },
                                              onHidden = function() {
                                                            context.target.empty();
                                                            context.target.append(newMarkup);
                                                            newMarkup.fadeIn("fast", onReveal);
                                                         };

                                          newMarkup.hide();
                                          if(children.length > 0) {
                                             children.fadeOut("fast", onHidden);
                                          } else {
                                             onHidden();
                                          }
                                       }},
       context   = null,
       listeners = {backward: function(context) {
                                 console.log("Backward event triggered for step plugin instance.");
                                 api.backward(context);
                              },
                    cancel:   function(context) {
                                 console.log("Cancel event triggered for step plugin instance.");
                                 if(context.configuration.events.cancel) {
                                    console.log("Found custom cancellation handler, calling it.");
                                    context.configuration.events.cancel(context.state);
                                 }
                              },
                    forward:  function(context) {
                                 console.log("Forward event triggered for step plugin.");
                                 api.forward(context);
                              },
                    restart:  function(context) {
                                 console.log("Restart event triggered for step plugin instance.");
                                 api.restart(context, context.state);
                              }},
       target    = $(this);

   if(!configuration || configuration.length === 0) {
      throw("No configuration or empty configuration specified for stepped control.");
   }

   context = {configuration: configuration,
              offset:        0,
              progression:   [],
              state:         {},
              target:        $(this)};

   // Set up event listeners.
   target.on("wizardry.backward", function() {listeners.backward(context);});
   target.on("wizardry.cancel", function() {listeners.cancel(context);});
   target.on("wizardry.forward", function() {listeners.forward(context);});
   target.on("wizardry.restart", function() {listeners.restart(context);});

   // Kick things off.
   api.restart(context);
};
