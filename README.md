# Wizardry

This is a library to facilitate the execution of a multistep process via a HTML
interface. The goals for this project are...

 * It will be event driven so that step transition can be triggered be external
   sources.

 * It can use templates (Mustache) for each step or individual URLs can be used
   to obtain the markup that constitutes the UI for a step.

 * The library will maintain a state object throughout the steps and code will
   be able to view and alter that state as needed.

 * Configuration should be via a Javascript object.

 * Progress will be directional (i.e. forward or backward) but need not be
   sequential.

 * It should be possible for the end user to define the handling of some
   fundamental events, such as cancelling the component or specifying the
   initial state for the component.

 * It should be possible for the user to specify validate functions for
   individual steps which will be called prior to progressing to the next step.
   These handlers can perform checking on data and update state. Validation
   handlers should return a boolean with false indicating that progression
   should not take place.

 * User interface is not the concern of the library, that's the end users
   concern.

## Dependencies

The library provides a jQuery plugin so jQuery is a required library (version
3.2.1 was used in development). The library also makes use of the Mustache
templating library, you will need to include that on any page that uses the
Wizardry library (version 2.3.0 was used in development).

## Usage

To use the library you must first make sure it's dependencies appear on the
page as well as the library itself...

```html
  <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
  <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/mustache.js/2.3.0/mustache.min.js"></script>
  <script type="text/javascript" src="js/wizardry-0.0.1.min.js"></script>
```

Next you have to make sure templates for the process are available. The simplest
way to achieve this is to place Mustache based templates inside script elements
of the page like the following...

```html
  <script type="text/x-mustache" id="template1">
    <div class="panel">
       <h1>Step {{step}}</h1>
       <p>Message: {{message}}</p>
       <center>
          <img src="images/image{{step}}.jpg" height="64px">
       </center>
       <br>

       <button class="wizardry-previous-control">Previous</button>
       <button class="wizardry-restart-control">Restart</button>
       <button class="wizardry-next-control">Continue</button>
    </div>
  </script>
```

Next place an element on the place that will be the target for the plugin, like
the following...

```html
  <div id="wizard"></div>
```

Finally you can initiate the plugin on the target element through Javascript as
follows...

```javascript
  jQuery("#wizard").wizardry(configuration);
```

The ```configuration``` entry here should be a Javscript array containing the
configuration entries for the individual steps in the process (see the next
section for further details on this).

## Sample Wizardry Configuration

A Wizardry configuration consists of an array of individual step entries. Each
entry is the configuration details for one step in the overall process. A
complete configuration includes the following elements...

```javascript
  {getNextStepId: function(state) {/* Called to get the unique id of the next step. */},
   id:            "StepUniqueIdentifier",
   onEnter:       function(state) {/* Function called after step is entered. */},
   onExit:        function(state) {/* Function called before step is exited. */},
   onShow:        function(state, ui) {/* Function called after step UI deployed. */},
   templateData:  function() {/* Function called to generate the data used for the template. */},
   ui:            {template: {selector: "TemplateElementId"}}}
```

All of these fields are optional but their purpose and potential uses are outlined
below...

    * getNextStepId - This function will be invoked and passed the current state
      for the control whenever a request is made to progress the control to its
      next step. This function should return the unique identifier of the next
      step to progress to, allowing for the application of logic to the
      progression through the steps. If this function is not present then
      progress continues to the next step in sequential order.

    * id - A string uniquely identify a step. This can be used in context with
      the getNextStepId entry to provide logic around progression.

    * onEnter - If present this function will be called when a step is first
      entered but before the steps user interface has been loaded. This
      function is passed the control state as a parameter.

    * onExit - If present this function will be called when the request to
      progress from a step is received. The function receives the current
      state for the control as a parameter. This function should have a
      true or false return value. If the return value is not true then
      step progression is cancelled.

    * onShow - If present this function will be called after the user interface
      for a step has been deployed to the page. This is an opportunity to do
      additional work such as setting the current control focus. This function
      is passed the control state as a parameter.

    * templateData - If present this function will be called when generating
      the context used while populating the UI template. If this function is
      provided then a combination of the state object and return value from
      this function will provide the context in which the template will be
      generated (be careful about object property names as those in the state
      object will be given priority over values in the object returned from
      this function). If not present then the current state object is used
      template generation only. This function allows for the addition of
      temporary data elements to a template context, stuff that you perhaps
      don't want to pollute the state with.

The ```ui``` entry is a little more complicated so it will be expanded upon
separately. When specifying the UI for a step you can choose from a number of
potential options.

First, and the simplest option you can choose to generate the UI from a named
Mustache template that exists on the page. The example above show this with the
```ui``` configuration entry being a JS object containing a ```template``` key.
This key in turn is for a JS object that contains a single ```selector``` entry
that keys onto a string giving the unique identifier of the template element on
the page.  Alternatively you can load the template from a remote URL. An example
for this configuration is given below...

```javascript
   ...
   ui: {method: "GET", url: "http://myserver.com/path/to/template"}}
```

Here the ```ui``` entry has two keys, ```method``` and ```url```. The first
specifies the HTTP verb to use when fetching the template. This entry is optional
and defaults to ```"GET"```. The second entry is the URL where the template can
be loaded from.


The context for template generation is the current state object (i.e. all
elements of state will be available as data for the template when it is compiled
for use).

## Simple Example

See the index.html entry in the repository for a simple example.

## Events

The Wizardry plugin is event driven and a number of event handlers are set up on
the target object when the plugin is invoked. You can use these events to trigger
programmatic progression or regression through the steps in a process. Here is
an example of how to request progress to the next step...

```javascript
  // One approach.
  jQuery(target).trigger("wizardry.forward");

  // Alternative approach to doing the same thing.
  jQuery(target).trigger(jQuery.Event("wizardry.forward"));
```

The following are a list of events recognised by the component...

  * ```wizardry.backward``` - Instructs the control to attempt a step backward
    in the process.

  * ```wizardry.cancel``` - Instructs the control to attempt to cancel the
    current process (requires that cancellation be configured).

  * ```wizardry.forward``` - Instructs the control to attempt a step forward
    in the process (may be blocked by validation).

  * ```wizardry.restart``` - Instructs the control to restart the process.

## Shortcuts

To minimize the amount of the code that needs to be written the library
recognises a number of classes in templates that it will automatically configure
click handlers in the elements for. The recognised classes are...

  * ```wizardry-next-control``` - Applies a click handler that will trigger a
    forward request on the control.

  * ```wizardry-previous-control``` - Applies a click handler that will trigger
    a backward request on the control.

  * ```wizardry-restart-control``` - Applies a click handler that will trigger a
    restart request on the control.
