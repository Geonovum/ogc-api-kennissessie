version = '1.2.3'
mountPath = "amstelveen"

title = 'Geonovum'
description = 'This is a test service used in the Geonovum API summerschool'

port = 80

limit = process.env.LIMIT || 1000

encodings = ['application/geo+json', 'application/json', 'text/html']
