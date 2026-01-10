import requests

API_ENDPOINT = 'https://discord.com/api/v10'
CLIENT_ID = '771479794109906994'
CLIENT_SECRET = 'NOPE'

def get_token():
  data = {
    'grant_type': 'client_credentials',
    'scope': 'identify applications.commands.update'
  }
  headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  r = requests.post('%s/oauth2/token' % API_ENDPOINT, data=data, headers=headers, auth=(CLIENT_ID, CLIENT_SECRET))
  r.raise_for_status()
  return r.json()

if __name__ == '__main__':
    token_info = get_token()
    print(token_info)
