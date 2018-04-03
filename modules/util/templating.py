def template(file, **kwargs):
    for key in kwargs:
        file = file.replace(f'{{{{ {key} }}}}', kwargs[key])
    return file
