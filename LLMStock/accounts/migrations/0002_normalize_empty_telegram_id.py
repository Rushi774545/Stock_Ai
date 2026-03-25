from django.db import migrations


def blank_telegram_to_null(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(telegram_id='').update(telegram_id=None)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(blank_telegram_to_null, migrations.RunPython.noop),
    ]
