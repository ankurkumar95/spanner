"""End-to-end flow test for Spanner CRM across all roles."""
import requests
import time

BASE = 'http://localhost:8000/api/v1'
SEG_ID = '387b1354-1e94-484f-9526-54cfe6fc46e0'
TS = str(int(time.time()))

def login(email, password='demo1234'):
    r = requests.post(f'{BASE}/auth/login', data={'username': email, 'password': password})
    r.raise_for_status()
    return r.json()['access_token']

def h(token):
    return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

def test(label, method, url, token, data=None, expect=None):
    fn = getattr(requests, method)
    kw = {'headers': h(token)}
    if data:
        kw['json'] = data
    r = fn(f'{BASE}{url}', **kw)
    ok = r.status_code == expect if expect else r.status_code < 400
    icon = 'PASS' if ok else 'FAIL'
    detail = ''
    if not ok:
        try:
            detail = f' -> {r.json().get("detail","")[:120]}'
        except Exception:
            detail = f' -> {r.text[:120]}'
    print(f'  [{icon}] {label}: {r.status_code}{detail}')
    return r

print('=' * 60)
print('SPANNER CRM - END-TO-END FLOW TEST')
print('=' * 60)

print('\n--- Step 0: Login all users ---')
admin_t = login('admin@spanner.local', 'admin123'); print('  [PASS] admin')
owner_t = login('owner@spanner.dev'); print('  [PASS] segment_owner')
res_t = login('researcher@spanner.dev'); print('  [PASS] researcher')
app_t = login('approver@spanner.dev'); print('  [PASS] approver')
sdr_t = login('sdr@spanner.dev'); print('  [PASS] sdr')
mkt_t = login('marketing@spanner.dev'); print('  [PASS] marketing')

print('\n--- Step 1: Researcher creates company ---')
r = test('Researcher creates company', 'post', '/companies/', res_t,
    {'company_name': f'FlowTest-{TS} Inc', 'company_website': f'https://flowtest-{TS}.com',
     'segment_id': SEG_ID, 'company_industry': 'Technology'}, expect=201)
cid = r.json()['id']
print(f'    ID={cid}, status={r.json()["status"]}')

test('SDR creates company (expect 403)', 'post', '/companies/', sdr_t,
    {'company_name': f'SDR-{TS} Corp', 'company_website': f'https://sdr-{TS}.com',
     'segment_id': SEG_ID}, expect=403)

print('\n--- Step 2: Approver approves company ---')
r = test('Approver approves', 'post', f'/companies/{cid}/approve', app_t,
    {'status': 'approved'})
print(f'    status={r.json().get("status")}')

test('Researcher approves (expect 403)', 'post', f'/companies/{cid}/approve', res_t,
    {'status': 'approved'}, expect=403)

print('\n--- Step 3: Researcher creates contact ---')
r = test('Researcher creates contact', 'post', '/contacts', res_t,
    {'first_name': 'Jane', 'last_name': f'Doe-{TS}', 'email': f'jane-{TS}@flowtest.com',
     'company_id': cid, 'job_title': 'VP Engineering'}, expect=201)
ctid = r.json()['id']
print(f'    ID={ctid}, status={r.json()["status"]}')

test('SDR creates contact (expect 403)', 'post', '/contacts', sdr_t,
    {'first_name': 'X', 'last_name': 'Y', 'email': f'x-{TS}@y.com',
     'company_id': cid}, expect=403)

print('\n--- Step 4: Approver approves contact ---')
r = test('Approver approves contact', 'post', f'/contacts/{ctid}/approve', app_t,
    {'status': 'approved'})
print(f'    status={r.json().get("status")}')

print('\n--- Step 5: Assign contact to SDR ---')
r = requests.get(f'{BASE}/users', headers=h(admin_t), params={'per_page': 100})
print(f'    Users endpoint: {r.status_code}')
sdr_id = next(u['id'] for u in r.json()['users'] if u['email'] == 'sdr@spanner.dev')
print(f'    SDR ID: {sdr_id}')

r = test('Approver assigns to SDR', 'post', f'/contacts/{ctid}/assign', app_t,
    {'assigned_sdr_id': sdr_id})
print(f'    status={r.json().get("status")}, sdr={r.json().get("assigned_sdr_id")}')

test('Researcher assigns (expect 403)', 'post', f'/contacts/{ctid}/assign', res_t,
    {'assigned_sdr_id': sdr_id}, expect=403)

print('\n--- Step 6: SDR marks meeting ---')
r = test('SDR marks meeting scheduled', 'post', f'/contacts/{ctid}/meeting-scheduled', sdr_t)
print(f'    status={r.json().get("status")}')

test('Researcher marks meeting (expect 403)', 'post', f'/contacts/{ctid}/meeting-scheduled', res_t,
    expect=403)

print('\n--- Step 7: Assignment module ---')
res_id = next(u['id'] for u in requests.get(f'{BASE}/users', headers=h(admin_t),
    params={'per_page': 100}).json()['users'] if u['email'] == 'researcher@spanner.dev')

test('Owner assigns seg->researcher', 'post', '/assignments/', owner_t,
    {'entity_type': 'segment', 'entity_id': SEG_ID, 'assigned_to': res_id}, expect=201)
test('Approver assigns co->researcher', 'post', '/assignments/', app_t,
    {'entity_type': 'company', 'entity_id': cid, 'assigned_to': res_id}, expect=201)
test('Researcher assigns (expect 403)', 'post', '/assignments/', res_t,
    {'entity_type': 'segment', 'entity_id': SEG_ID, 'assigned_to': sdr_id}, expect=403)

r = test('Researcher checks my assignments', 'get', '/assignments/me', res_t)
print(f'    Assignments: {len(r.json())} items')

print('\n--- Step 8: Segment stats ---')
r = test('Segments with stats', 'get', '/segments/', res_t)
for s in r.json():
    print(f'    {s["name"]}: companies={s["company_count"]}, contacts={s["contact_count"]}, '
          f'pending={s["pending_company_count"]}, by={s["created_by_name"]}')

print('\n' + '=' * 60)
print('ALL TESTS COMPLETE')
print('=' * 60)
