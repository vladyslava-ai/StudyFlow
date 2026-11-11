def test_tasks_crud(client):
    created=client.post('/api/tasks',json={'title':'Підготувати лабораторну','priority':'high','due_date':'2026-12-01'})
    assert created.status_code==201
    tid=created.json()['id']
    assert len(client.get('/api/tasks').json())==1
    assert client.patch(f'/api/tasks/{tid}',json={'status':'done'}).json()['status']=='done'
    assert client.delete(f'/api/tasks/{tid}').status_code==204
    assert client.get('/api/tasks').json()==[]

def test_calendar(client):
    result=client.get('/api/calendar?days=14')
    assert result.status_code==200
    assert len(result.json())==14

def test_auth_demo(client):
    credentials={'email':'student@example.com','password':'strong-test-password'}
    assert client.post('/api/auth/register',json=credentials).status_code==201
    assert client.post('/api/auth/register',json=credentials).status_code==409
    assert client.post('/api/auth/login',json=credentials).status_code==200
    assert client.post('/api/auth/login',json={**credentials,'password':'incorrect'}).status_code==401
