const News = require('./news')

const express = require('express')
const { engine } = require('express-handlebars')
const morgan = require('morgan')

const port = parseInt(process.env.PORT) || 3000
const newsKey = process.env.NEWSAPI_KEY 

const app = express();
const news = new News(newsKey)

app.engine('hbs', engine({ defaultLayout: 'main', extname: '.hbs' }))
app.set('view engine', 'hbs')

app.use(morgan('common'))

app.get(['/', '/index.html'], (req, resp) => {
	const q = req.query.q || ''
	const country = req.query.country || ''
	news(q, country)
		.then(news => {
			resp.render('news', { 
				articles: news.articles, 
				hasArticles: news.articles.length > 0,
				country, q
			})
		})
})

app.get('/healthz', (_, resp) => {
	resp.contentType("application/json")
	if (!!newsKey) {
		resp.status(200)
		resp.send({ 
			version: 'v1', 
			date: (new Date()).toUTCString(),  
		})
	} else {
		resp.status(400)
		resp.send({ 
			version: 'v1', 
			date: (new Date()).toUTCString(),  
			error: 'News API key is not set'
		})
	}
})

app.get('/version', (_, resp) => {
	resp.contentType("application/json")
	resp.send({ 
		version: 'v1', 
		date: (new Date()).toUTCString(),  
	})
})

app.use(express.static(`${__dirname}/static`))

app.listen(port, () => {
	console.info(`Application started on port ${port} at ${new Date()}`)
	if (!newsKey)
		console.error('\tNews API is not set')
	else
		console.info('\tNews API key is set')
})
