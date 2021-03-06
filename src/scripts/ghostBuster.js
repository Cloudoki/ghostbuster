/**
 * ghostBUster - 1.0.0
 * Copyright (C) 2015 Rui Molefas (rui@cloudoki.com)
 * MIT Licensed
 * @license
 */
(function( $ ) {

	//This is the main plugin definition
	$.fn.ghostBuster 	= function( options ) {
	 
	 	//Here we use jQuery's extend to set default values if they weren't set by the user
	    var opts 		= $.extend( {}, $.fn.ghostBuster.defaults, options );
	    if( opts.results ) 
    	{
    		pluginMethods.init( this , opts );
    		return pluginMethods;
    	}
	};
	 
	$.fn.ghostBuster.defaults = {
		results 			: false,
		rss 				: "/rss",
		onKeyUp 			: false,
		info_template		: "<p id='num-results'>Number of posts found: {{amount}}</p>",
		displaySearchInfo 	: true,
		zeroResultsInfo		: true,
		before 				: false,
		onComplete 			: false,
		/*jshint multistr: true */
		result_template		:  '<article class="post"> \
								    <header class="post-header"> \
								        <h2 class="post-title"><a href="{{link}}">{{title}}</a></h2> \
								    </header> \
								    <section class="post-excerpt"> \
								        <p>{{description}}<a class="read-more" href="{{link}}">»</a></p> \
								    </section> \
								    <footer class="post-meta"> \
								        <a href="#">{{author}}</a> \
								        <time class="post-date" datetime="{{pubDate}}">{{pubDate}}</time> \
								    </footer> \
								</article>' 
	};

	var pluginMethods 	= {

		isInit 			: false,

		init 			: function( target , opts ){

			var that 				= this;
			this.target 			= target;
			this.rss 				= opts.rss;
			this.results 			= opts.results;
			this.path				= opts.path;
			this.direct				= opts.direct;
			this.blogData 			= [];
			this.result_template 	= opts.result_template;
			this.info_template 		= opts.info_template;
			this.zeroResultsInfo 	= opts.zeroResultsInfo;
			this.displaySearchInfo  = opts.displaySearchInfo;
			this.before 			= opts.before;
			this.onComplete 		= opts.onComplete;

			//This is where we'll build the index for later searching. It's not a big deal to build it on every load as it takes almost no space without data
			this.index = lunr(function () {
			    this.field('title', {boost: 10});
			    this.field('description');
			    this.field('author');
			    this.field('link');
			    this.field('category');
			    this.field('pubDate');
			    this.ref('id');
			});

			target.focus(function(){
				that.loadRSS();
			});

			target.closest("form").submit(function(e){
				e.preventDefault();
				that.find(target.val());
			});

			$(this.direct).closest("form").submit(function(e){
				e.preventDefault();
				var search = $(that.direct).val();
				window.location.replace(window.location.origin+that.path+'?'+search);
			});

			if( opts.onKeyUp ) {
				that.loadRSS();
				target.keyup(function() {
					that.find(target.val());
				});
			}

			if (window.location.pathname == this.path)
				this.makeSearch();

		},

		makeSearch: function() {

			var hash = window.location.href.split("?");

			if (hash.length >= 2) {
				this.target.val(decodeURI(hash[1]));
				this.loadRSS(this.find.bind(this, decodeURI(hash[1])));
			}
		},

		loadRSS			: function(callback){

			if(this.isInit) return false;

		/*	Here we load an rss feed, parse it and load it into the index. 
			This function will not call on load to avoid unnecessary heavy 
			operations on a page if a visitor never ends up searching anything. */
			
			var index 		= this.index,
				rssURL 		= this.rss,
				blogData 	= this.blogData;

			$.get(rssURL,function( data ){

		    	var posts = $(data).find('item');

		    	for (var i = 0; posts && i < posts.length; i++) {
			        var post  		= posts.eq(i);
			        var parsedData 	= {
						id: i+1,
						title 		: post.find('title').text(),
						description	: post.find('description').text(),
						category 	: post.find('category').text(),
						pubDate 	: post.find('pubDate').text(),
						link 		: post.find('link').text(),
						author		: post.find('author').text()
					};

				    index.add(parsedData);
				    blogData.push(parsedData);
			    }

			    if (callback)
			    	callback();

			});

			this.isInit = true;

		},

		find 		 	: function( value ){
			var searchResult 	= this.index.search( value );
			var results 		= $(this.results);
			var resultsData 	= [];
			results.empty();

			if(this.before) {
				this.before();
			}

			if(this.zeroResultsInfo || searchResult.length > 0)
			{
				if(this.displaySearchInfo) results.append(this.format(this.info_template,{"amount":searchResult.length}));
			}

			for (var i = 0; i < searchResult.length; i++)
			{
				var postData  	= this.blogData[searchResult[i].ref - 1];
				results.append(this.format(this.result_template,postData));
				resultsData.push(postData);
			}

			if(this.onComplete) {
				this.onComplete(resultsData);
			}
		},

		clear 			: function(){
			$(this.results).empty();
			this.target.val("");
		},

		format 			: function (t, d) {
	        return t.replace(/{{([^{}]*)}}/g, function (a, b) {
	            var r = d[b];
	            return typeof r === 'string' || typeof r === 'number' ? r : a;
	        });
		}
	};

})( jQuery );