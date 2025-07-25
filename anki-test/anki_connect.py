import requests

ANKICONNECT_URL = 'http://localhost:8765'

def anki_connect(action, params=None):
    try:
        res = requests.post(ANKICONNECT_URL, json={
            'action': action,
            'version': 6,
            'params': params or {}
        }, timeout=5)
        return res.json()
    except Exception as e:
        return {'error': str(e)}

call_action = anki_connect

# 标准AC action同名函数（小驼峰）
def deckNames(params=None):
    return anki_connect('deckNames', params)
def deckNamesAndIds(params=None):
    return anki_connect('deckNamesAndIds', params)
def createDeck(params):
    return anki_connect('createDeck', params)
def findCards(params):
    return anki_connect('findCards', params)
def cardsInfo(params):
    return anki_connect('cardsInfo', params)
def findNotes(params):
    return anki_connect('findNotes', params)
def notesInfo(params):
    return anki_connect('notesInfo', params)
def addNote(params):
    return anki_connect('addNote', params)
def addNotes(params):
    return anki_connect('addNotes', params)
def updateNoteFields(params):
    return anki_connect('updateNoteFields', params)
def deleteNotes(params):
    return anki_connect('deleteNotes', params)
def removeEmptyNotes(params=None):
    return anki_connect('removeEmptyNotes', params)
def modelNames(params=None):
    return anki_connect('modelNames', params)
def modelFieldNames(params):
    return anki_connect('modelFieldNames', params)
def modelTemplates(params):
    return anki_connect('modelTemplates', params)
def modelStyling(params):
    return anki_connect('modelStyling', params)
def getProfiles(params=None):
    return anki_connect('getProfiles', params)
def sync(params=None):
    return anki_connect('sync', params)
def guiBrowse(params):
    return anki_connect('guiBrowse', params)
def guiAddCards(params=None):
    return anki_connect('guiAddCards', params)
def guiDeckOverview(params):
    return anki_connect('guiDeckOverview', params)
def guiReviewCard(params=None):
    return anki_connect('guiReviewCard', params)
def getNumCardsReviewedToday(params=None):
    return anki_connect('getNumCardsReviewedToday', params)
def getCollectionStatsHTML(params):
    return anki_connect('getCollectionStatsHTML', params) 