import base64

def test_auth_cookie_and_isolation(client):
    one = client.post('/api/subjects', json={'name':'Приватний Python','goal_minutes':300})
    assert one.status_code == 201
    first_id = one.json()['id']
    client.post('/api/auth/logout')
    assert client.get('/api/subjects').status_code == 401
    assert client.post('/api/auth/register',json={'email':'other@example.com','password':'safe-password-456'}).status_code == 201
    assert client.get('/api/subjects').json() == []
    assert client.get(f'/api/subjects/{first_id}').status_code == 404
    assert client.post('/api/sessions',json={'subject_id':first_id,'minutes':30}).status_code == 404
    assert client.get('/api/stats/week').json()['total_minutes'] == 0

def test_profile_and_photo(client):
    response=client.patch('/api/profile',json={'display_name':'Владислава'})
    assert response.status_code == 200
    assert response.json()['display_name'] == 'Владислава'
    assert client.put('/api/profile/avatar',json={'image':'data:text/html;base64,PGgxPg=='}).status_code == 422
    png=base64.b64encode(b'\x89PNG\r\n\x1a\n'+b'example').decode()
    response=client.put('/api/profile/avatar',json={'image':'data:image/png;base64,'+png})
    assert response.status_code == 200
    assert response.json()['avatar_data'].startswith('data:image/png')
    assert client.put('/api/profile/avatar',json={'image':None}).json()['avatar_data'] is None
