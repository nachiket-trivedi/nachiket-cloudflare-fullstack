// Code Author: Nachiket Trivedi
// Note: The comments are written before the start of each method/class delineating the functionality of the method/class.


addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
/**
 * Respond with hello worker text
 * @param {Request} request
 */


// For custom HTML modification, I used the ElementHandler provided by Cloudflare. Based on the element type and the id, I changed the title, heading, url, para.
// My LinkedIn is associated with variant one, and my Github is associated with variant two.
class ElementHandler {
  constructor(variant){
    this.variant=variant
  }
  element(element) {
    console.log('this variant',this.variant)
    if(element.tagName=='title'){
      let newTitle=this.variant=='first_variant'? "Nachiket's Variant One" : "Nachiket's Variant Two"
      element.setInnerContent(newTitle)
    }    
    if(element.tagName=="h1"){
      let newHeading=this.variant=='first_variant'? "Variant One (Nachiket's LinkedIn)" : "Variant Two (Nachiket's GitHub)"
      if(element.getAttribute('id')=='title')
        element.setInnerContent(newHeading)
    }
    if(element.tagName=="p"){
      let newPara=this.variant=='first_variant'? "Click to see Nachiket's LinkedIn" : "Click to see Nachiket's GitHub"
      if(element.getAttribute('id')=='description')
        element.setInnerContent(newPara)
    }
    if(element.tagName=="a"){
      let newAnchorText=this.variant=='first_variant'? "LinkedIn" : "GitHub"
      let newUrl=this.variant=='first_variant'? "https://www.linkedin.com/in/nachiket-trivedi" : "https://www.github.com/nachiket-trivedi"
      if(element.getAttribute('id')=='url'){
        element.setInnerContent(newAnchorText)
        element.setAttribute('href',newUrl)
      }
    }
  }
}


// The loadVariant method will take as input the url of which the content is to be loaded. For same user, it'll load the same based on the cookie, for a 
// new user, it'll be a new variant. The response of the fetch api called for this url will be passed for further HTML customization to the ElementHandler
// class. This is done to fulfill the extra credit question.
async function loadVariant(final_variant, variant){
    let final_response=await fetch(final_variant)
    console.log("variant--",variant)
    if(final_response.ok){
      extra_credit_response= new HTMLRewriter().on('*', new ElementHandler(variant)).transform(final_response)
      return extra_credit_response
      
      //below is the normal response, without the extra credit implementation of html modification. 
        let final_site_html_text=await final_response.text()
        resp = new Response(final_site_html_text, {
          headers: { 'content-type': 'application' , 'Accept': 'application'},
        })
    }
    else {
      alert("HTTP-Error: " + final_response.status);
    }
  }

// The handleTraffic function will basically take the two urls from the input. I've incorporated the additional extra credit
// cookie question. I used the A/B testing method provided by Cloudflare for this. If it gets the cookie as either 
// the 'first_version' or 'second_version' in the cookie name of cloudflare-cookie, it'll load the respective variant accordingly.
// If no cookie is found, then based on an unbiased random function with 50-50 probability, a new cookie is set and the loadVariant is called
// accordingly.
async function handleTraffic( request, url1, url2 ){
  const NAME = 'cloudflare-cookie'
  const FIRST_VARIANT = url1
  const SECOND_VARIANT = url2
  const cookie =  request.headers.get('cookie')
  if (cookie && cookie.includes(`${NAME}=first_variant`)) {
    return loadVariant(FIRST_VARIANT, "first_variant")
  } else if (cookie && cookie.includes(`${NAME}=second_variant`)) {
    return loadVariant(SECOND_VARIANT, "second_variant")
  } else {
    let decided_variant = Math.random() < 0.5 ? 'first_variant' : 'second_variant'
    let response = decided_variant === 'first_variant' ? await loadVariant(FIRST_VARIANT, "first_variant") : await loadVariant(SECOND_VARIANT, "second_variant")
    response.headers.append('Set-Cookie', `${NAME}=${decided_variant}; path=/`)
    return response
  }
}


// The main function
async function handleRequest(request) {
  let url='https://cfw-takehome.developers.workers.dev/api/variants'
  let main_response = await fetch(url);
  if (main_response.ok) { 
    let main_json = await main_response.json();
    console.log('response--',main_json.variants)
    // taking the response of the given api, and passing the response into the handleTraffic function
    let url_arrays=main_json.varaints
    let url1=main_json.variants[0]
    let url2=main_json.variants[1]
    console.log('url1--',url1)
    console.log('url2--',url2)
    return await handleTraffic( request, url1, url2)    
  } else {
    alert("HTTP-Error: " + response.status);
  }
}

