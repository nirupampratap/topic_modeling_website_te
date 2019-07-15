import gensim
import json
import boto3
import uuid
import numpy as np

s3_client = boto3.client('s3')

topic_label = {	0: "Automobile / Phones",
		1: "Government",
		2: "Education / Courses",
		3: "Celebrities / Individuals / Interviews",
		4: "Employment / Skills / Training",
		5: "Needs / Issues",
		6: "Degree / Education / Exams",
		7: "Investments / Insurance",
		8: "Economics / Budget / Finance / Loans",
		9: "English / Non-Telugu article",
		10: "Cooking / Recipes",
		11: "Unknown 1",
		12: "Unknown 2",
		13: "Sports / Cricket",
		14: "Health / Exercise / Nutrition / Weight"
		}

# Would consider changing this later. NLTK tokenizer is not working as intended. Hence resorting to this
def clean_word(word):
    word = word.replace("\u200c","")
    word = word.replace(":","")
    word = word.replace(",","")
    word = word.replace(";","")
    word = word.replace("`","")
    word = word.replace("'","")
    word = word.replace(".","")
    word = word.replace("\"","")
    word = word.replace("\\","")
    word = word.replace("\n","")
    word = word.replace("/n","")
    word = word.replace("#","")
    word = word.replace("%","")
    word = word.replace("&","")
    word = word.replace("*","")
    word = word.replace("(","")
    word = word.replace(")","")
    word = word.replace("{","")
    word = word.replace("}","")
    word = word.replace("[","")
    word = word.replace("=","")
    word = word.replace("]","")
    word = word.replace("-","")
    word = word.replace("_","")
    word = word.replace("+","")
    word = word.replace("‘","")
    word = word.replace("?","")
    word = word.replace("!","")
    word = word.replace("~","")
    
    return word

def identify_topics(new_doc):

	# First download the file
	bucket = "nirupam-lambda-bucket"
	filenames = ["lda_te.model", "lda_te.model.expElogbeta.npy", "lda_te.model.id2word", "lda_te.model.state"]
	down_filenames = []
	unique_string = uuid.uuid4()

	for key in filenames:
		download_path = '/tmp/{}{}'.format(unique_string, key)
		s3_client.download_file(bucket, key, download_path)
		down_filenames.append(download_path)

	# Load the model and the dictionary
	model = gensim.models.ldamodel.LdaModel.load(down_filenames[0])
	id2word = gensim.corpora.Dictionary.load(down_filenames[2])

	# Now apply the model and dictionary on the new text string
	bow = id2word.doc2bow([clean_word(word) for word in new_doc.split()])
	topics = sorted(model.get_document_topics(bow=bow), key=lambda x: (x[1]), reverse=True)

	topics_converted = {}
	# Recreate the topics to make it json workable
	for t in topics:
		topics_converted[t[0]] = np.round(float(t[1]),3)

	topic_names = {}

	for row in topics:
		t_name = topic_label[row[0]]
#		for t in model.show_topic(row[0]):
#			t_name += '({}, {}), '.format(t[0],np.round(float(t[1]),3))
		topic_names[row[0]] = t_name


	ret_dict = {}
	ret_dict['topic_distribution'] = topics_converted
	ret_dict['topic_names'] = topic_names

	return json.dumps(ret_dict)


def my_handler(event, context):

	new_document = None

	test = json.loads(event['body'])

	if('body' in event):
		body_data = json.loads(event['body'])
		if('telugu_data' in body_data):
			new_document = body_data['telugu_data']

	response = {}
	
	if(new_document is None or new_document == ""):
		response = json.dumps({})
	else:
		response = identify_topics(new_document)


	return { 
		'statusCode': 200,
		'headers': {
				"Access-Control-Allow-Origin" : "*", # Required for CORS support to work
				"Access-Control-Allow-Credentials" : True, # Required for cookies, authorization headers with HTTPS 
				"Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
				"access-control-allow-methods": "GET,PUT,POST,DELETE,OPTIONS"
			},
		'body': response
	}

